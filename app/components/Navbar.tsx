"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { t, LOCALES } from "@/lib/i18n";
import SierraLogo from "@/app/components/SierraLogo";

export default function Navbar() {
  const { locale, setLocale } = useLocale();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const i18n = t(locale);
  
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const links = [
    { label: i18n.nav.menu,     href: "/menu" },
    { label: i18n.nav.about,    href: "/about" },
    { label: i18n.nav.reviews,  href: "/reviews" },
    { label: i18n.nav.booking,  href: "/#booking" },
    { label: i18n.nav.contacts, href: "/contacts" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Закрываем мобильное меню при изменении размера окна
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0f0d0b]/90 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between"
           style={{ height: "clamp(64px, 10vw, 72px)" }}>

        {/* Логотип */}
        <SierraLogo href="/" size="sm" priority />

        {/* Desktop-навигация */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-[rgba(245,240,232,0.55)] hover:text-[#f5f0e8] transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA + Язык */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {/* Корзина */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/[0.06] transition group"
            aria-label="Корзина"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[rgba(245,240,232,0.6)] group-hover:text-[#c9a96e] transition"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {/* Бейдж с количеством товаров */}
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9a96e] text-[#0f0d0b] text-xs font-semibold rounded-full flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Переключатель языка */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-lg hover:bg-white/[0.06] transition text-sm text-[rgba(245,240,232,0.6)]"
              aria-label="Выбрать язык"
            >
              <span>{LOCALES.find(l => l.code === locale)?.flag}</span>
              <span className="uppercase font-medium">{locale}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 rounded-xl bg-[#161411] border border-white/[0.08] py-1 shadow-xl z-50">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLocale(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                      locale === l.code
                        ? "text-[#c9a96e] bg-[#c9a96e]/10"
                        : "text-[rgba(245,240,232,0.6)] hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            // Авторизованный пользователь
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-white/[0.06] transition text-sm text-[rgba(245,240,232,0.9)]"
              >
                {(user as any).avatar ? (
                  <img
                    src={(user as any).avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-[#c9a96e]/30 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline">{user.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#161411] border border-white/[0.08] shadow-xl z-20 py-2">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {i18n.nav.myProfile}
                    </Link>
                    <Link
                      href="/my-bookings"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {i18n.nav.myBookings}
                    </Link>
                    <button
                      onClick={async () => {
                        setProfileOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-500/5 hover:text-red-400 transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                      </svg>
                      {i18n.logout}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Не авторизован
            <>
              <Link href="/login" className="text-sm text-[rgba(245,240,232,0.55)] hover:text-[#f5f0e8] transition">
                {i18n.nav.login}
              </Link>
            </>
          )}
          
          <a href="#menu" className="btn-gold hidden lg:inline-flex" style={{ height: "40px", padding: "0 20px", fontSize: "0.8125rem" }}>
            {i18n.nav.order}
          </a>
        </div>

        {/* Мобильные действия (корзина + бургер) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Корзина на мобильных */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/[0.06] transition active:scale-95"
            aria-label="Корзина"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[rgba(245,240,232,0.6)]"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c9a96e] text-[#0f0d0b] text-xs font-semibold rounded-full flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

        {/* Бургер */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/[0.06] transition active:scale-95"
          aria-label="Меню"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-px bg-[#f5f0e8] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
          <span className={`block w-5 h-px bg-[#f5f0e8] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-[#f5f0e8] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
        </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}
      <div
        className={`md:hidden fixed top-[clamp(64px,10vw,72px)] left-0 right-0 bottom-0 z-50 transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="h-full bg-[#0f0d0b]/98 backdrop-blur-md border-t border-white/[0.06] px-4 sm:px-6 py-6 flex flex-col overflow-y-auto">
          {/* Профиль в мобильном меню (если авторизован) */}
          {user && (
            <div className="mb-6 pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3 mb-4">
                {(user as any).avatar ? (
                  <img
                    src={(user as any).avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full border border-[#c9a96e]/30 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] text-lg font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-[#f5f0e8] truncate">{user.name}</p>
                  <p className="text-sm text-[rgba(245,240,232,0.4)] truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] rounded-lg transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {i18n.nav.myProfile}
                </Link>
                <Link
                  href="/my-bookings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] rounded-lg transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {i18n.nav.myBookings}
                </Link>
              </div>
            </div>
          )}

          {/* Навигационные ссылки */}
          <div className="flex-1 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-3.5 px-3 text-base text-[rgba(245,240,232,0.7)] hover:text-[#f5f0e8] hover:bg-white/[0.04] rounded-lg transition-colors active:scale-[0.98]"
              >
                {l.label}
              </Link>
            ))}
          </div>
          
          {/* Язык в мобильном меню */}
          <div className="py-4 border-y border-white/[0.06] my-4">
            <p className="text-xs text-[rgba(245,240,232,0.35)] mb-3 uppercase tracking-wider px-3">{i18n.nav.langLabel}</p>
            <div className="grid grid-cols-3 gap-2">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setMenuOpen(false); }}
                  className={`py-3 rounded-lg text-sm font-medium transition active:scale-95 ${
                    locale === l.code
                      ? "bg-[#c9a96e] text-[#0f0d0b]"
                      : "bg-white/[0.04] text-[rgba(245,240,232,0.5)] hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="text-base mb-1 block">{l.flag}</span>
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col gap-3 pt-2">
            {!user && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="py-3.5 text-center text-sm font-medium text-[rgba(245,240,232,0.7)] hover:text-[#f5f0e8] border border-white/[0.1] hover:border-white/[0.2] rounded-lg transition active:scale-[0.98]"
              >
                {i18n.nav.login}
              </Link>
            )}
            
            <a
              href="#menu"
              onClick={() => setMenuOpen(false)}
              className="btn-gold py-3.5 text-center text-base font-semibold"
            >
              {i18n.nav.order}
            </a>

            {user && (
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
                className="py-3.5 text-center text-sm font-medium text-red-400/80 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 rounded-lg transition active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  {i18n.logout}
                </span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
