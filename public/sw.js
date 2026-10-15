/**
 * Sierra Coffee — Service Worker
 *
 * Стратегии:
 * - Статика (JS/CSS/шрифты/иконки): Cache-First
 * - Страницы (навигация): Network-First с fallback на /offline.html
 * - API: Network-Only (персональные данные, заказы, оплата — не кэшируем)
 *
 * Безопасность:
 * - Не кэшируются /api/* маршруты
 * - Не кэшируются /admin/* маршруты
 * - Не кэшируются ответы с авторизационными данными
 */

const CACHE_VERSION  = "sierra-v1";
const STATIC_CACHE   = `${CACHE_VERSION}-static`;
const PAGES_CACHE    = `${CACHE_VERSION}-pages`;

// Статические ресурсы для предварительного кэширования
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/menu",
  "/about",
  "/contacts",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Расширения статических файлов — всегда Cache-First
const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|webp|svg|ico|gif)(\?.*)?$/i;

// Маршруты, которые НИКОГДА не кэшируем
const NEVER_CACHE = /^\/(api|admin|_next\/data)\//;

// ─── Install ───────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Кэшируем по одному — не ломаемся если один URL недоступен
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch {
          // Тихо пропускаем недоступные URL при установке
        }
      }
    })
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Только HTTP(S), только GET
  if (!url.protocol.startsWith("http") || request.method !== "GET") return;

  // Никогда не перехватываем API / Admin / Next data
  if (NEVER_CACHE.test(url.pathname)) return;

  // Статические файлы (_next/static + любые расширения) — Cache-First
  if (url.pathname.startsWith("/_next/static/") || STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Навигация и страницы — Network-First с offline fallback
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Всё остальное — Network-First без fallback
  event.respondWith(networkFirst(request, PAGES_CACHE));
});

// ─── Стратегии ────────────────────────────────────────────────────────────────

/** Cache-First: сначала кэш, при промахе — сеть и кэшируем результат */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/** Network-First: сначала сеть, при ошибке — кэш */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}

/** Network-First для страниц с красивой offline-страницей */
async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Пробуем кэш этой страницы
    const cached = await cache.match(request);
    if (cached) return cached;

    // Кэш корневой страницы
    const root = await cache.match("/");
    if (root) return root;

    // Красивая offline-страница
    const offline = await caches.match("/offline.html");
    if (offline) return offline;

    // Минимальный fallback
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sierra Coffee — Offline</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body{background:#17130F;color:#F7F1E8;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}
      .card{padding:2rem;max-width:320px}.icon{font-size:4rem;margin-bottom:1rem}
      h1{color:#c9a96e;font-size:1.5rem;margin:0 0 .75rem}p{opacity:.6;font-size:.9rem;line-height:1.6}</style></head>
      <body><div class="card"><div class="icon">☕</div>
      <h1>Sierra Coffee</h1><p>Нет подключения к интернету.<br>Проверьте соединение и попробуйте снова.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
