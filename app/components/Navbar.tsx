"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { useAuth } from "@/lib/AuthContext";
import { t, LOCALES } from "@/lib/i18n";

export default function Navbar() {
  const { locale, setLocale } = useLocale();
  const { user, logout } = useAuth();
  const i18n = t(locale);
  
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const links = [
    { label: i18n.nav.menu,     href: "#menu" },
    { label: i18n.nav.about,    href: "#about" },
    { label: i18n.nav.booking,  href: "#booking" },
    { label: i18n.nav.contacts, href: "#contacts" },
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
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between"
           style={{ height: "72px" }}>

        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center transition group-hover:bg-[#c9a96e]/20">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 12h20v2a10 10 0 01-20 0v-2z"
                stroke="#c9a96e" strokeWidth="1.5" strokeLinejoin="round"
              />
              <path
                d="M10 12V8a6 6 0 0112 0v4"
                stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"
              />
              <path
                d="M10 24v3M22 24v3M8 27h16"
                stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="text-lg font-semibold tracking-tight text-[#f5f0e8]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sierra Coffee
          </span>
        </Link>

        {/* Desktop-навигация */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[rgba(245,240,232,0.55)] hover:text-[#f5f0e8] transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA + Язык */}
        <div className="hidden md:flex items-center gap-3">
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
                      Мой профиль
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
                      Мои бронирования
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
          
          <a href="#menu" className="btn-gold" style={{ height: "40px", padding: "0 20px", fontSize: "0.8125rem" }}>
            {i18n.nav.order}
          </a>
        </div>

        {/* Бургер */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/[0.06] transition"
          aria-label="Меню"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-px bg-[#f5f0e8] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
          <span className={`block w-5 h-px bg-[#f5f0e8] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-[#f5f0e8] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
        </button>
      </div>

      {/* Мобильное меню */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="bg-[#0f0d0b]/95 backdrop-blur-md border-t border-white/[0.06] px-6 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm text-[rgba(245,240,232,0.65)] hover:text-[#f5f0e8] border-b border-white/[0.04] transition-colors"
            >
              {l.label}
            </a>
          ))}
          
          {/* Язык в мобильном меню */}
          <div className="py-3 border-b border-white/[0.04]">
            <p className="text-xs text-[rgba(245,240,232,0.35)] mb-2 uppercase tracking-wider">Язык</p>
            <div className="flex gap-2">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setMenuOpen(false); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                    locale === l.code
                      ? "bg-[#c9a96e] text-[#0f0d0b]"
                      : "bg-white/[0.04] text-[rgba(245,240,232,0.5)]"
                  }`}
                >
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {user ? (
            <button
              onClick={async () => {
                setMenuOpen(false);
                await logout();
              }}
              className="py-3 text-sm text-red-400/80 hover:text-red-400 border-b border-white/[0.04] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              {i18n.logout}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm text-[rgba(245,240,232,0.65)] hover:text-[#f5f0e8] border-b border-white/[0.04] transition-colors"
            >
              {i18n.nav.login}
            </Link>
          )}
          
          <a
            href="#menu"
            onClick={() => setMenuOpen(false)}
            className="btn-gold mt-3"
            style={{ width: "100%" }}
          >
            {i18n.nav.order}
          </a>
        </nav>
      </div>
    </header>
  );
}
