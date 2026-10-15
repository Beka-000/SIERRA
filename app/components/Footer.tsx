"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import SierraLogo from "@/app/components/SierraLogo";

// ─── Социальные сети ──────────────────────────────────────────────────────────

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com/sierracoffee.kg",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me/sierracoffeekg",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/996555000000",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
  },
];

// ─── Иконки контактов ─────────────────────────────────────────────────────────

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
  </svg>
);

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Логотип — используем единый компонент SierraLogo ────────────────────────
// (убрана старая функция Logo с SVG чашки)

// ─── Компонент футера ─────────────────────────────────────────────────────────

export default function Footer() {
  const { locale } = useLocale();
  const i18n = t(locale);
  const f = i18n.footer;

  // Фиксируем год на клиенте после монтирования, чтобы избежать
  // mismatch если сервер и браузер в разных часовых поясах.
  const [year, setYear] = useState(2025);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative bg-[#0e0b08] border-t border-white/[0.05]">
      {/* Золотая линия сверху */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c9a96e]/35 to-transparent" />

      {/* ── Основная сетка ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-6 sm:pb-8">

        {/*
          Сетка брейкпоинтов:
          mobile  (< 640px) : бренд full-width, затем 2×2 колонки для ссылок, контакты под ними
          sm      (≥ 640px) : 2 колонки (бренд+контакты | ссылки)
          lg      (≥ 1024px): 4 колонки равные
        */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10">

          {/* ── 1. Бренд ─────────────────────────────────────── col-span-2 mobile / col-span-1 sm */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <Link href="/" className="inline-block mb-4 hover:opacity-90 transition-opacity">
              <SierraLogo size="sm" />
            </Link>

            <p className="text-[13px] leading-relaxed text-[rgba(245,240,232,0.42)] mb-5 max-w-[260px]">
              {f.description}
            </p>

            {/* Соцсети */}
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[rgba(245,240,232,0.4)] flex items-center justify-center hover:border-[#c9a96e]/35 hover:text-[#c9a96e] hover:bg-[#c9a96e]/08 transition active:scale-95"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── 2. Меню ──────────────────────────────────────── col 1 (mobile левый) */}
          <div className="col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(245,240,232,0.28)] mb-3.5">
              {f.menuTitle}
            </p>
            <ul className="space-y-2.5">
              {[
                { label: f.coffee,    href: "/menu" },
                { label: f.tea,       href: "/menu" },
                { label: f.breakfast, href: "/menu" },
                { label: f.desserts,  href: "/menu" },
                { label: f.allMenu,   href: "/menu" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-[rgba(245,240,232,0.48)] hover:text-[#f5f0e8] hover:translate-x-0.5 transition-all inline-block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 3. Информация ────────────────────────────────── col 2 (mobile правый) */}
          <div className="col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(245,240,232,0.28)] mb-3.5">
              {f.serviceTitle}
            </p>
            <ul className="space-y-2.5">
              {[
                { label: f.about,       href: "/about" },
                { label: f.delivery,    href: "/delivery" },
                { label: f.onlineOrder, href: "/menu" },
                { label: f.booking,     href: "/#booking" },
                { label: f.loyalty,     href: "/loyalty" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-[rgba(245,240,232,0.48)] hover:text-[#f5f0e8] hover:translate-x-0.5 transition-all inline-block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 4. Контакты ──────────────────────────────────── col-span-2 mobile / col-span-1 lg */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(245,240,232,0.28)] mb-3.5">
              {f.contactsTitle}
            </p>

            {/*
              Сетка контактов:
              mobile (< 640px): 2 колонки — телефон+email слева, адрес+часы справа
              sm+   (≥ 640px): 1 колонка (стандартный список)
            */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-3 sm:gap-y-3">

              {/* Телефон */}
              <a
                href="tel:+996555000000"
                className="group flex items-start gap-2 min-w-0 hover:text-[#c9a96e] transition-colors"
              >
                <span className="mt-0.5 w-5 h-5 rounded-md bg-[#c9a96e]/10 flex items-center justify-center flex-shrink-0 text-[#c9a96e]/70 group-hover:bg-[#c9a96e]/18 transition">
                  <PhoneIcon />
                </span>
                <span className="text-[13px] text-[rgba(245,240,232,0.48)] group-hover:text-[#c9a96e] transition-colors min-w-0 break-words overflow-wrap-anywhere leading-snug">
                  {f.phone}
                </span>
              </a>

              {/* Адрес */}
              <a
                href="https://maps.google.com/?q=Sierra+Coffee+Bishkek"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 min-w-0 hover:text-[#c9a96e] transition-colors"
              >
                <span className="mt-0.5 w-5 h-5 rounded-md bg-[#c9a96e]/10 flex items-center justify-center flex-shrink-0 text-[#c9a96e]/70 group-hover:bg-[#c9a96e]/18 transition">
                  <PinIcon />
                </span>
                <span className="text-[13px] text-[rgba(245,240,232,0.48)] group-hover:text-[#c9a96e] transition-colors min-w-0 break-words leading-snug">
                  {f.address}
                </span>
              </a>

              {/* Email */}
              <a
                href="mailto:hello@sierracoffee.kg"
                className="group flex items-start gap-2 min-w-0 hover:text-[#c9a96e] transition-colors"
              >
                <span className="mt-0.5 w-5 h-5 rounded-md bg-[#c9a96e]/10 flex items-center justify-center flex-shrink-0 text-[#c9a96e]/70 group-hover:bg-[#c9a96e]/18 transition">
                  <MailIcon />
                </span>
                <span className="text-[13px] text-[rgba(245,240,232,0.48)] group-hover:text-[#c9a96e] transition-colors min-w-0 break-all leading-snug">
                  {f.email}
                </span>
              </a>

              {/* Часы работы */}
              <div className="flex items-start gap-2 min-w-0">
                <span className="mt-0.5 w-5 h-5 rounded-md bg-[#c9a96e]/10 flex items-center justify-center flex-shrink-0 text-[#c9a96e]/70">
                  <ClockIcon />
                </span>
                <span className="text-[13px] text-[rgba(245,240,232,0.48)] min-w-0 break-words leading-snug">
                  {f.hours}
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* ── Нижняя строка ──────────────────────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 pt-4 sm:pt-5 border-t border-white/[0.05]">
          <div className="flex flex-col xs:flex-row items-center justify-between gap-3">

            {/* Копирайт */}
            <p className="text-[11px] text-[rgba(245,240,232,0.22)] text-center xs:text-left order-2 xs:order-1">
              © {year} {f.copyright}
            </p>

            {/* Юридические ссылки */}
            <div className="flex items-center gap-4 order-1 xs:order-2">
              <Link
                href="/privacy"
                className="text-[11px] text-[rgba(245,240,232,0.22)] hover:text-[rgba(245,240,232,0.5)] transition whitespace-nowrap"
              >
                {f.privacy}
              </Link>
              <span className="w-px h-3 bg-white/[0.1]" />
              <Link
                href="/terms"
                className="text-[11px] text-[rgba(245,240,232,0.22)] hover:text-[rgba(245,240,232,0.5)] transition whitespace-nowrap"
              >
                {f.terms}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
