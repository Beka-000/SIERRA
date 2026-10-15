"use client";

import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";

// Фиксированные позиции частиц — вычисляются один раз, одинаковы на сервере и клиенте.
// Math.random() в теле компонента даёт разные значения при SSR и CSR → hydration error.
const PARTICLES = [
  { left: 8,  top: 12, delay: 0.0, duration: 17 },
  { left: 22, top: 45, delay: 1.3, duration: 20 },
  { left: 37, top: 78, delay: 2.7, duration: 16 },
  { left: 51, top: 23, delay: 0.8, duration: 22 },
  { left: 63, top: 60, delay: 3.5, duration: 18 },
  { left: 74, top: 88, delay: 1.9, duration: 15 },
  { left: 85, top: 35, delay: 4.2, duration: 21 },
  { left: 92, top: 70, delay: 0.5, duration: 19 },
  { left: 15, top: 92, delay: 6.1, duration: 17 },
  { left: 43, top: 5,  delay: 2.3, duration: 23 },
  { left: 68, top: 15, delay: 5.0, duration: 16 },
  { left: 30, top: 55, delay: 7.4, duration: 20 },
];

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
          backgroundImage: `url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=90&w=2800&auto=format&fit=crop')`,
          transform: `translateY(${scrollY * 0.3}px)`,
          scale: "1.08",
        }}
      />
      
      {/* Многослойный overlay — меньше затемнения чем раньше, фото лучше видно */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#17130F]/80 via-[#17130F]/55 to-[#17130F]/92" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#17130F]/70 via-transparent to-[#17130F]/70" />
      {/* Нижний градиент для плавного перехода к следующей секции */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#17130F] to-transparent" />

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
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#c9a96e]/20 rounded-full animate-float"
            style={{
              left:              `${p.left}%`,
              top:               `${p.top}%`,
              animationDelay:    `${p.delay}s`,
              animationDuration: `${p.duration}s`,
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
          className="animate-fade-up-delay-1 text-[clamp(2.2rem,7vw,4.5rem)] font-semibold leading-[1.08] tracking-tight text-[#f5f0e8] mb-5 sm:mb-6 px-2"
          style={{ fontFamily: "var(--font-display)", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          {i18n.hero.title}{" "}
          <span className="relative inline-block text-[#D9B66F]">
            {i18n.hero.titleAccent}
            {/* Декоративная линия под акцентным словом */}
            <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#D9B66F]/40" />
          </span>{" "}
          {i18n.hero.titleEnd}
        </h1>

        {/* Подзаголовок */}
        <p className="animate-fade-up-delay-2 max-w-lg mx-auto text-base sm:text-lg leading-relaxed text-[rgba(245,240,232,0.70)] mb-8 sm:mb-10 px-4"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
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
        <div className="animate-fade-up-delay-4 mt-14 sm:mt-20 flex items-center justify-center gap-0 max-w-sm sm:max-w-md mx-auto">
          {[
            { value: "4.9★",  label: i18n.hero.rating },
            { value: "50+",   label: i18n.hero.menuItems },
            { value: "3 000+",label: i18n.hero.guests },
          ].map((item, i) => (
            <div key={item.label} className="flex-1 text-center px-2 sm:px-4 relative">
              {i > 0 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[#D9B66F]/15" />
              )}
              <p
                className="text-xl sm:text-2xl font-bold text-[#D9B66F]"
                style={{ fontFamily: "var(--font-display)", textShadow: "0 0 20px rgba(217,182,111,0.3)" }}
              >
                {item.value}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-[rgba(245,240,232,0.45)] leading-tight">{item.label}</p>
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
