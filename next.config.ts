import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ── Service Worker — никогда не кэшировать, всегда свежий ─────────────
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control",             value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type",              value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed",    value: "/" },
        ],
      },
      // ── Web App Manifest ──────────────────────────────────────────────────
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type",  value: "application/manifest+json" },
        ],
      },
      // ── PWA иконки — кэшируем надолго ────────────────────────────────────
      {
        source: "/(icon-:size.png|apple-touch-icon.png|favicon-:size.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ── Offline-страница — всегда свежая ──────────────────────────────────
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      // ── Глобальные заголовки безопасности ────────────────────────────────
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
