"use client";

import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";

export default function Hero() {
  const { locale } = useLocale();
  const i18n = t(locale);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16 sm:pt-0"
    >
      {/* Фоновое изображение кофейни с parallax */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-100"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2400&auto=format&fit=crop')`,
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      />
      
      {/* Тёмный градиент overlay для читаемости */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0d0b]/95 via-[#0f0d0b]/85 to-[#0f0d0b]/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0d0b]/80 via-transparent to-[#0f0d0b]/80" />
      
      {/* Виньетка по краям */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,13,11,0.4)_100%)]" />

      {/* Тонкая текстура grain */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Декоративные элементы - тонкие круги */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vw)] rounded-full border border-[#c9a96e]/[0.04] pointer-events-none animate-pulse-slow" />
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,70vw)] h-[min(420px,70vw)] rounded-full border border-[#c9a96e]/[0.06] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Плавающие частицы кофе */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#c9a96e]/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Контент */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">

        {/* Бейдж */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-[#c9a96e]/25 bg-[#c9a96e]/[0.08] backdrop-blur-sm mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] animate-pulse" />
          <span className="text-xs font-medium text-[#c9a96e] tracking-widest uppercase">
            {i18n.hero.badge}
          </span>
        </div>

        {/* Заголовок */}
        <h1
          className="animate-fade-up-delay-1 text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight text-[#f5f0e8] mb-5 sm:mb-6 drop-shadow-2xl px-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {i18n.hero.title}{" "}
          <span className="text-[#c9a96e]">{i18n.hero.titleAccent}</span>{" "}
          {i18n.hero.titleEnd}
        </h1>

        {/* Подзаголовок */}
        <p className="animate-fade-up-delay-2 max-w-xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed text-[rgba(245,240,232,0.65)] mb-8 sm:mb-10 drop-shadow-lg px-4">
          {i18n.hero.subtitle}
        </p>

        {/* CTA */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4">
          <a href="#menu" className="btn-gold min-h-[48px] sm:min-h-0 w-full sm:w-auto group relative overflow-hidden">
            <span className="relative z-10">{i18n.hero.menuBtn}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4b87a] to-[#c9a96e] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a href="#booking" className="btn-outline min-h-[48px] sm:min-h-0 w-full sm:w-auto backdrop-blur-sm">
            {i18n.hero.bookingBtn}
          </a>
        </div>

        {/* Метрики */}
        <div className="animate-fade-up-delay-4 mt-12 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-6 max-w-sm mx-auto px-2">
          {[
            { value: "4.9",   label: i18n.hero.rating },
            { value: "50+",   label: i18n.hero.menuItems },
            { value: "3 000+",label: i18n.hero.guests },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p
                className="text-xl sm:text-2xl font-semibold text-[#c9a96e] drop-shadow-lg"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.value}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-xs text-[rgba(245,240,232,0.5)] leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Стрелка вниз */}
      <a
        href="#about"
        className="hidden sm:flex absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-[rgba(245,240,232,0.35)] hover:text-[rgba(245,240,232,0.6)] transition group"
        aria-label={i18n.hero.scrollDown}
      >
        <span className="text-xs tracking-widest uppercase">{i18n.hero.scrollDown}</span>
        <svg
          className="animate-bounce"
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
