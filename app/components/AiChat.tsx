"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { useCart } from "@/lib/CartContext";
import { t } from "@/lib/i18n";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  weightOrVolume: string | null;
  calories: number | null;
  isRecommended: boolean;
  category: { id: string; title: string };
}

interface CartAction {
  action: "add" | "show_cart";
  productId?: string;
  quantity?: number;
}

type MessageRole = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  products?: Product[];
  cartAction?: CartAction | null;
  cartProduct?: Product | null;
  isError?: boolean;
}

// ─── Иконка AI ────────────────────────────────────────────────────────────────

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

// ─── Карточка товара ──────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAddToCart,
  addedIds,
  currency,
  addToCartLabel,
  addedLabel,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  addedIds: Set<string>;
  currency: string;
  addToCartLabel: string;
  addedLabel: string;
}) {
  const added = addedIds.has(product.id);

  return (
    <div className="rounded-xl bg-[#1a1410] border border-white/[0.08] overflow-hidden hover:border-[#c9a96e]/30 transition-colors">
      {/* Фото */}
      <div className="w-full h-28 bg-white/[0.03] flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl">☕</span>
        )}
      </div>

      {/* Инфо */}
      <div className="p-3">
        {product.isRecommended && (
          <span className="inline-block mb-1 px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/20">
            ★ Хит
          </span>
        )}
        <p className="text-xs font-semibold text-[#f5f0e8] leading-snug mb-0.5 line-clamp-2">
          {product.title}
        </p>
        {product.weightOrVolume && (
          <p className="text-[10px] text-white/35 mb-1">{product.weightOrVolume}</p>
        )}
        {product.description && (
          <p className="text-[10px] text-white/45 line-clamp-2 mb-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-sm font-bold text-[#c9a96e]">
              {product.price} {currency}
            </span>
            {product.oldPrice && (
              <span className="ml-1 text-[10px] text-white/30 line-through">
                {product.oldPrice} {currency}
              </span>
            )}
          </div>

          <button
            onClick={() => !added && onAddToCart(product)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              added
                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                : "bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/20 hover:bg-[#c9a96e]/25 active:scale-95"
            }`}
          >
            {added ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {addedLabel}
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {addToCartLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Пузырь сообщения ────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onAddToCart,
  addedIds,
  i18n,
  items,
  totalAmount,
}: {
  msg: Message;
  onAddToCart: (p: Product) => void;
  addedIds: Set<string>;
  i18n: ReturnType<typeof t>;
  items: any[];
  totalAmount: number;
}) {
  const isUser      = msg.role === "user";
  const isAssistant = msg.role === "assistant";
  const isSystem    = msg.role === "system";

  // Показываем корзину, если ИИ запросил show_cart
  const showCart = msg.cartAction?.action === "show_cart";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Аватар ассистента */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center mt-0.5">
          <SparkleIcon className="w-3.5 h-3.5 text-[#c9a96e]" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {/* Основной пузырь текста */}
        {msg.content && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? "bg-[#c9a96e] text-[#0f0d0b] rounded-br-sm font-medium"
                : isSystem
                ? "bg-[#1e1a15] border border-white/[0.06] text-white/50 text-xs italic"
                : msg.isError
                ? "bg-red-500/10 border border-red-500/15 text-red-300 text-xs"
                : "bg-[#1e1a15] border border-white/[0.06] text-[#f5f0e8] rounded-bl-sm"
            }`}
          >
            {msg.content}
            {!isUser && !isSystem && !msg.isError && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] text-white/20">
                <SparkleIcon className="w-2 h-2" />
                {i18n.aiChat.poweredBy}
              </span>
            )}
          </div>
        )}

        {/* Карточки товаров */}
        {msg.products && msg.products.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full">
            {msg.products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={onAddToCart}
                addedIds={addedIds}
                currency={i18n.aiChat.currency}
                addToCartLabel={i18n.aiChat.addToCart}
                addedLabel={i18n.aiChat.addedToCart}
              />
            ))}
          </div>
        )}

        {/* Верифицированный товар для добавления через CART_ACTION */}
        {msg.cartProduct && !msg.products?.some((p) => p.id === msg.cartProduct!.id) && (
          <div className="w-full max-w-[200px]">
            <ProductCard
              product={msg.cartProduct}
              onAddToCart={onAddToCart}
              addedIds={addedIds}
              currency={i18n.aiChat.currency}
              addToCartLabel={i18n.aiChat.addToCart}
              addedLabel={i18n.aiChat.addedToCart}
            />
          </div>
        )}

        {/* Корзина */}
        {showCart && (
          <div className="w-full rounded-xl bg-[#1a1410] border border-white/[0.08] p-3">
            <p className="text-xs font-semibold text-[#c9a96e] mb-2">
              {i18n.aiChat.cartInfo} ({items.length} {i18n.aiChat.cartItems})
            </p>
            {items.length === 0 ? (
              <p className="text-xs text-white/40">{i18n.cart.empty}</p>
            ) : (
              <>
                <div className="space-y-1 mb-2">
                  {items.map((item: any) => (
                    <div key={item.productId} className="flex justify-between text-xs text-white/70">
                      <span className="truncate mr-2">{item.title} × {item.quantity}</span>
                      <span className="flex-shrink-0 text-[#c9a96e]">
                        {item.price * item.quantity} {i18n.aiChat.currency}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-semibold text-white border-t border-white/[0.08] pt-2 mb-2">
                  <span>{i18n.aiChat.cartTotal}</span>
                  <span className="text-[#c9a96e]">{totalAmount} {i18n.aiChat.currency}</span>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full py-1.5 rounded-lg bg-[#c9a96e] text-[#0f0d0b] text-xs font-semibold text-center hover:bg-[#d4b87a] transition"
                >
                  {i18n.aiChat.toCheckout}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Ссылка на корзину когда добавили товар */}
        {msg.cartAction?.action === "add" && msg.cartProduct && (
          <Link
            href="/cart"
            className="text-[10px] text-[#c9a96e] hover:text-[#d4b87a] underline underline-offset-2 transition"
          >
            {i18n.aiChat.viewCart} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Индикатор загрузки ───────────────────────────────────────────────────────

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center">
        <SparkleIcon className="w-3.5 h-3.5 text-[#c9a96e]" />
      </div>
      <div className="bg-[#1e1a15] border border-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="text-xs text-white/40">{label}</span>
      </div>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function AiChat() {
  const { locale } = useLocale();
  const { items, totalAmount, addItem } = useCart();
  const i18n = t(locale);
  const ai = i18n.aiChat;

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  // Инициализация приветственного сообщения
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id:      "welcome",
          role:    "assistant",
          content: ai.welcome,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обновляем приветствие при смене языка только если чат ещё не начат (только welcome)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [{ id: "welcome", role: "assistant", content: ai.welcome }];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Скролл к последнему сообщению
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open, loading]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Закрытие по Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem({
        productId:      product.id,
        title:          product.title,
        price:          product.price,
        imageUrl:       product.imageUrl,
        weightOrVolume: product.weightOrVolume,
      });
      setAddedIds((prev) => new Set(prev).add(product.id));
    },
    [addItem]
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id:      `u-${Date.now()}`,
      role:    "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // История для передачи на сервер (без welcome и без системных)
    const historyForApi = messages
      .filter((m) => m.role !== "system" && m.id !== "welcome")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message: text,
          history: historyForApi,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Обрабатываем конкретные ошибки
        let errorText = ai.errorApi + " " + ai.fullMenu;
        if (data.error === "rate_limit")      errorText = ai.errorLimit;
        if (data.error === "quota_exceeded")  errorText = ai.errorLimit;
        if (data.error === "no_key")          errorText = ai.errorKey;

        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", content: errorText, isError: true },
        ]);
        return;
      }

      // Автодобавление в корзину если AI вернул CART_ACTION add
      let cartProduct = data.cartProduct ?? null;
      if (
        data.cartAction?.action === "add" &&
        data.cartProduct &&
        typeof data.cartAction.quantity === "number"
      ) {
        const qty = Math.max(1, Math.min(data.cartAction.quantity ?? 1, 10));
        addItem({
          productId:      data.cartProduct.id,
          title:          data.cartProduct.title,
          price:          data.cartProduct.price, // цена из БД (верифицированная)
          imageUrl:       data.cartProduct.imageUrl,
          weightOrVolume: data.cartProduct.weightOrVolume,
          quantity:       qty,
        });
        setAddedIds((prev) => new Set(prev).add(data.cartProduct.id));
      }

      const assistantMsg: Message = {
        id:          `a-${Date.now()}`,
        role:        "assistant",
        content:     data.text ?? "",
        products:    data.products ?? [],
        cartAction:  data.cartAction ?? null,
        cartProduct: cartProduct,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("[AiChat] fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id:      `e-${Date.now()}`,
          role:    "assistant",
          content: ai.errorApi + " " + ai.fullMenu + ".",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, locale, ai, addItem]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([{ id: "welcome", role: "assistant", content: ai.welcome }]);
    setAddedIds(new Set());
  };

  return (
    <>
      {/* ── Кнопка открытия ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={ai.openBtn}
        className="fixed bottom-6 right-6 z-[998] flex items-center gap-2 h-12 px-4 rounded-2xl bg-[#c9a96e] text-[#0f0d0b] font-semibold text-sm shadow-[0_4px_24px_rgba(201,169,110,0.35)] hover:bg-[#d4b87a] active:scale-95 transition-all duration-200 select-none"
        style={{ boxShadow: "0 4px 24px rgba(201,169,110,0.35), 0 2px 8px rgba(0,0,0,0.4)" }}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <SparkleIcon className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{open ? ai.closeBtn : ai.title}</span>
        {/* Бейдж корзины */}
        {items.length > 0 && !open && (
          <span className="ml-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#0f0d0b]/20 text-[10px] font-bold flex items-center justify-center">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {/* ── Панель чата ──────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={`fixed z-[999] transition-all duration-300 ease-out
          bottom-[5rem] right-4 sm:right-6
          w-[calc(100vw-2rem)] sm:w-[400px] md:w-[420px]
          max-h-[calc(100svh-7rem)]
          flex flex-col
          rounded-2xl overflow-hidden
          bg-[#17130f] border border-white/[0.08]
          shadow-[0_8px_48px_rgba(0,0,0,0.6)]
          ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
        style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.08)" }}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#1a1410] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center flex-shrink-0">
              <SparkleIcon className="w-4 h-4 text-[#c9a96e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f5f0e8] leading-none mb-0.5">{ai.title}</p>
              <p className="text-[10px] text-white/35 leading-none">{ai.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Индикатор корзины */}
            {items.length > 0 && (
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/15 text-[#c9a96e] text-[10px] font-medium hover:bg-[#c9a96e]/20 transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {items.length}
              </Link>
            )}
            {/* Очистить */}
            <button
              onClick={handleClear}
              title={ai.clearBtn}
              className="w-7 h-7 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] flex items-center justify-center transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
            {/* Закрыть */}
            <button
              onClick={() => setOpen(false)}
              aria-label={ai.closeBtn}
              className="w-7 h-7 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] flex items-center justify-center transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onAddToCart={handleAddToCart}
              addedIds={addedIds}
              i18n={i18n}
              items={items}
              totalAmount={totalAmount}
            />
          ))}

          {loading && <TypingIndicator label={ai.thinking} />}

          <div ref={bottomRef} />
        </div>

        {/* Быстрые подсказки */}
        {messages.length <= 1 && !loading && (
          <div className="px-3 pb-2 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {[
                locale === "ky" ? "Раф тап" : locale === "en" ? "Find a raf" : "Найди раф",
                locale === "ky" ? "Таттуу кофе" : locale === "en" ? "Sweet coffee" : "Сладкий кофе",
                locale === "ky" ? "Менин себетим" : locale === "en" ? "My cart" : "Моя корзина",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => { setInput(hint); setTimeout(() => inputRef.current?.focus(), 0); }}
                  className="px-2.5 py-1 rounded-full text-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50 hover:border-[#c9a96e]/30 hover:text-[#c9a96e] transition active:scale-95"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Поле ввода */}
        <div className="px-3 pb-3 flex-shrink-0">
          <div className="flex items-end gap-2 bg-[#1a1410] border border-white/[0.08] rounded-xl p-2 focus-within:border-[#c9a96e]/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ai.placeholder}
              rows={1}
              maxLength={500}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-[#f5f0e8] placeholder-white/25 resize-none outline-none py-1 px-1 leading-relaxed max-h-28 overflow-y-auto disabled:opacity-50"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label={ai.sendBtn}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#c9a96e] text-[#0f0d0b] flex items-center justify-center hover:bg-[#d4b87a] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[9px] text-white/20 text-center">{ai.poweredBy}</p>
        </div>
      </div>
    </>
  );
}
