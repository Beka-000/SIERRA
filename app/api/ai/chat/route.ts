import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history: ChatMessage[];
  locale: "ru" | "en" | "ky";
}

interface ProductResult {
  id: string;
  title: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  weightOrVolume: string | null;
  calories: number | null;
  composition: string | null;
  allergens: string | null;
  isRecommended: boolean;
  category: { id: string; title: string };
}

// ─── Модели ───────────────────────────────────────────────────────────────────

const PRIMARY_MODEL  = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

// ─── Rate limiting (простой in-memory) ───────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 10;

function checkRateLimit(ip: string): boolean {
  const now    = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

// ─── Пауза ────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Проверка доступности fallback-модели через Gemini API ───────────────────

async function isFallbackAvailable(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return false;
    const data = await res.json() as {
      models: Array<{ name: string; supportedGenerationMethods: string[] }>;
    };
    return (data.models ?? []).some(
      (m) =>
        m.name === `models/${FALLBACK_MODEL}` &&
        m.supportedGenerationMethods?.includes("generateContent")
    );
  } catch {
    return false;
  }
}

// ─── Вызов Gemini с повторами при 503 ────────────────────────────────────────

const RETRY_DELAYS_MS = [1000, 2000, 4000]; // паузы между попытками

async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 400 },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });

  const recentHistory = history.slice(-6);
  const chat = model.startChat({
    history: recentHistory.map((m) => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  // До 3 повторов при 503
  let lastError: any;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      const is503 =
        err?.status === 503 ||
        err?.message?.includes("503") ||
        err?.message?.toLowerCase().includes("unavailable") ||
        err?.message?.toLowerCase().includes("overloaded");

      // Повторяем только при 503 и только если есть ещё попытки
      if (is503 && attempt < RETRY_DELAYS_MS.length) {
        console.warn(
          `[AI Chat] ${modelName} returned 503, retry ${attempt + 1}/${RETRY_DELAYS_MS.length} after ${RETRY_DELAYS_MS[attempt]}ms`
        );
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      // Любая другая ошибка или исчерпаны попытки — пробрасываем
      throw err;
    }
  }
  throw lastError;
}

// ─── Системный промпт ─────────────────────────────────────────────────────────

function buildSystemPrompt(locale: string, catalogSummary: string): string {
  return `You are a friendly AI assistant for Sierra Coffee — a premium coffee shop in Bishkek, Kyrgyzstan.

Your job:
1. Help customers find drinks and food from Sierra Coffee's menu.
2. Answer questions about ingredients, prices, composition, calories, and allergens.
3. Recommend products based on customer preferences.
4. NEVER invent products, prices, or ingredients — only use data from the catalog below.
5. If a product is not in the catalog, honestly say it is not available.
6. When relevant products are found, the system will display them as cards — you do NOT need to repeat all details in text, just give a brief comment.
7. Keep answers short and friendly.
8. To add items to cart, reply with a JSON action block (see below).

CATALOG (current available products):
${catalogSummary}

LANGUAGE RULE:
- If the user writes in Russian → answer in Russian.
- If the user writes in Kyrgyz → answer in Kyrgyz.
- If the user writes in English → answer in English.
- Current interface locale: ${locale}

CART ACTIONS:
When a user wants to add a product to the cart, include this JSON block at the END of your message (after your text reply):
[CART_ACTION:{"action":"add","productId":"<id>","quantity":<n>}]

Only use productIds that exist in the catalog above.

CART QUERY:
When a user asks to see their cart or total, include this at the end:
[CART_ACTION:{"action":"show_cart"}]

Keep responses concise. Be warm and helpful like a good barista.`;
}

// ─── Поиск товаров в БД ───────────────────────────────────────────────────────

async function searchProducts(query: string, maxPrice?: number): Promise<ProductResult[]> {
  const where: any = { isHidden: false, isAvailable: true };

  if (query.trim()) {
    where.OR = [
      { title:       { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { composition: { contains: query, mode: "insensitive" } },
      { allergens:   { contains: query, mode: "insensitive" } },
    ];
  }

  if (maxPrice !== undefined) where.price = { lte: maxPrice };

  const products = await prisma.product.findMany({
    where,
    take: 8,
    orderBy: [{ isRecommended: "desc" }, { createdAt: "desc" }],
    include: {
      category:  { select: { id: true, title: true } },
      photoFile: { select: { url: true } },
    },
  });

  return products.map((p) => ({
    id:             p.id,
    title:          p.title,
    description:    p.description,
    price:          Number(p.price),
    oldPrice:       p.oldPrice ? Number(p.oldPrice) : null,
    imageUrl:       p.photoFile?.url ?? null,
    weightOrVolume: p.weightOrVolume,
    calories:       p.calories,
    composition:    p.composition,
    allergens:      p.allergens,
    isRecommended:  p.isRecommended,
    category:       p.category,
  }));
}

// ─── Загрузка краткого каталога для контекста Gemini ─────────────────────────

async function loadCatalogSummary(): Promise<string> {
  const products = await prisma.product.findMany({
    where: { isHidden: false, isAvailable: true },
    take: 80,
    orderBy: [{ isRecommended: "desc" }, { title: "asc" }],
    include: {
      category:  { select: { title: true } },
      photoFile: { select: { url: true } },
    },
  });

  return products
    .map(
      (p) =>
        `[${p.id}] ${p.title} | ${p.category.title} | ${Number(p.price)} сом` +
        (p.weightOrVolume ? ` | ${p.weightOrVolume}` : "") +
        (p.description    ? ` | ${p.description.slice(0, 100)}` : "") +
        (p.composition    ? ` | Состав: ${p.composition.slice(0, 80)}` : "") +
        (p.calories       ? ` | ${p.calories} ккал` : "")
    )
    .join("\n");
}

// ─── Извлечение поисковых терминов из сообщения ───────────────────────────────

function extractSearchTerms(message: string): { query: string; maxPrice?: number } {
  let maxPrice: number | undefined;
  const priceMatch = message.match(
    /(?:до|не дороже|дешевле|cheaper than|up to|under|кем|арзан)\s*(\d+)/i
  );
  if (priceMatch) maxPrice = parseInt(priceMatch[1], 10);

  const stopWords = /\b(найди|найдите|покажи|покажите|есть|хочу|ищу|recommend|find|show|want|тап|көрсөт|бар)\b/gi;
  const query = message.replace(stopWords, "").replace(/[?!.,]/g, "").trim();
  return { query: query.slice(0, 100), maxPrice };
}

// ─── Дружелюбное сообщение об ошибке по локали ───────────────────────────────

function friendlyErrorMessage(locale: string): string {
  if (locale === "ky") return "AI жардамчы азыр жеткиликсиз. Бир аздан кийин кайра аракет кылыңыз.";
  if (locale === "en") return "The AI assistant is temporarily unavailable. Please try again in a moment.";
  return "AI-помощник временно недоступен. Пожалуйста, попробуйте чуть позже.";
}

// ─── Главный обработчик ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limit по IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "rate_limit", message: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  // Проверяем наличие API ключа
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return NextResponse.json(
      { error: "no_key", message: "Gemini API key is not configured." },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { message, history = [], locale = "ru" } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "missing_message" }, { status: 400 });
  }
  if (message.length > 500) {
    return NextResponse.json({ error: "message_too_long" }, { status: 400 });
  }

  try {
    // 1. Параллельно загружаем каталог и ищем товары
    const { query, maxPrice } = extractSearchTerms(message);
    const [catalogSummary, searchResults] = await Promise.all([
      loadCatalogSummary(),
      searchProducts(query, maxPrice),
    ]);

    const systemPrompt = buildSystemPrompt(locale, catalogSummary);

    // 2. Вызов Gemini: сначала PRIMARY, при стойком 503 — FALLBACK
    let rawText: string;
    try {
      rawText = await callGemini(apiKey, PRIMARY_MODEL, systemPrompt, history, message);
    } catch (primaryErr: any) {
      const is503 =
        primaryErr?.status === 503 ||
        primaryErr?.message?.includes("503") ||
        primaryErr?.message?.toLowerCase().includes("unavailable") ||
        primaryErr?.message?.toLowerCase().includes("overloaded");

      if (!is503) throw primaryErr; // не 503 — пробрасываем сразу

      // PRIMARY исчерпал все повторы с 503 — проверяем fallback
      console.warn(`[AI Chat] ${PRIMARY_MODEL} exhausted all retries. Checking fallback...`);
      const fallbackOk = await isFallbackAvailable(apiKey);

      if (!fallbackOk) {
        console.warn(`[AI Chat] Fallback model ${FALLBACK_MODEL} not available.`);
        return NextResponse.json(
          { error: "unavailable", text: friendlyErrorMessage(locale) },
          { status: 503 }
        );
      }

      console.warn(`[AI Chat] Switching to fallback: ${FALLBACK_MODEL}`);
      rawText = await callGemini(apiKey, FALLBACK_MODEL, systemPrompt, history, message);
    }

    // 3. Извлекаем CART_ACTION если есть
    let cartAction: Record<string, unknown> | null = null;
    const cartMatch = rawText.match(/\[CART_ACTION:(\{[^}]+\})\]/);
    if (cartMatch) {
      try { cartAction = JSON.parse(cartMatch[1]); } catch { /* ignore */ }
    }

    const cleanText = rawText.replace(/\[CART_ACTION:[^\]]+\]/g, "").trim();

    // 4. Верифицируем продукт для добавления в корзину (цена ВСЕГДА из БД)
    let cartProduct: ProductResult | null = null;
    if (cartAction?.action === "add" && typeof cartAction.productId === "string") {
      const dbProduct = await prisma.product.findFirst({
        where: { id: cartAction.productId, isHidden: false, isAvailable: true },
        include: {
          category:  { select: { id: true, title: true } },
          photoFile: { select: { url: true } },
        },
      });
      if (dbProduct) {
        cartProduct = {
          id:             dbProduct.id,
          title:          dbProduct.title,
          description:    dbProduct.description,
          price:          Number(dbProduct.price),
          oldPrice:       dbProduct.oldPrice ? Number(dbProduct.oldPrice) : null,
          imageUrl:       dbProduct.photoFile?.url ?? null,
          weightOrVolume: dbProduct.weightOrVolume,
          calories:       dbProduct.calories,
          composition:    dbProduct.composition,
          allergens:      dbProduct.allergens,
          isRecommended:  dbProduct.isRecommended,
          category:       dbProduct.category,
        };
      }
    }

    return NextResponse.json({ text: cleanText, products: searchResults, cartAction, cartProduct });

  } catch (err: any) {
    console.error("[AI Chat] Unhandled error:", err?.message ?? err);

    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      return NextResponse.json({ error: "quota_exceeded", message: "Gemini quota exceeded." }, { status: 429 });
    }

    return NextResponse.json(
      { error: "unavailable", text: friendlyErrorMessage(locale ?? "ru") },
      { status: 503 }
    );
  }
}
