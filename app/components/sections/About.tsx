const values = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title:   "Локальное происхождение",
    text:    "Работаем с кыргызскими поставщиками зерна и поддерживаем местных фермеров.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <path d="M18 8h1a4 4 0 010 8h-1" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <path d="M6 1v3M10 1v3M14 1v3" />
      </svg>
    ),
    title:   "Мастерство обжарки",
    text:    "Собственная обжарка зерна — каждая чашка раскрывает уникальный терруар.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    title:   "Атмосфера",
    text:    "Пространство создано для работы, встреч и неспешного отдыха в любое время дня.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title:   "Каждый день",
    text:    "Открыты с 8 утра до 22 вечера без выходных — завтрак, обед и вечерний кофе.",
  },
];

export default function About() {
  return (
    <section id="about" className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
      {/* Фоновый акцент */}
      <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#c9a96e]/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Шапка */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-xs font-medium tracking-widest uppercase text-[#c9a96e] mb-3 sm:mb-4">
            О нас
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#f5f0e8] leading-tight mb-4 sm:mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Кофейня, которая живёт кофе
          </h2>
          <p className="text-[rgba(245,240,232,0.5)] text-base sm:text-lg leading-relaxed">
            Sierra Coffee — это не просто место для чашки кофе. Мы создаём опыт,
            где каждая деталь продумана: от зерна до интерьера. Наша команда бариста
            — это увлечённые профессионалы, которые умеют удивлять.
          </p>
        </div>

        {/* Два блока: текст + карточки */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start">

          {/* Левая — история */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-[#161411] border border-white/[0.06] p-6 sm:p-8">
              {/* Декор-линия */}
              <div className="hidden sm:block absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/40 to-transparent" />

              <blockquote
                className="text-lg sm:text-xl leading-relaxed text-[rgba(245,240,232,0.75)] mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                «Мы открылись с одной целью — доказать, что хороший кофе
                меняет настроение и день целиком.»
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
                  <span className="text-[#c9a96e] font-semibold text-sm">АС</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f5f0e8]">Айдос Смаилов</p>
                  <p className="text-xs text-[rgba(245,240,232,0.4)] truncate">Основатель Sierra Coffee</p>
                </div>
              </div>

              {/* Разделитель */}
              <div className="my-6 sm:my-8 h-px bg-white/[0.06]" />

              {/* Мини-факты */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { label: "Год открытия",  value: "2021" },
                  { label: "Город",         value: "Бишкек" },
                  { label: "Бариста",       value: "8 мастеров" },
                  { label: "Сорта кофе",    value: "12+ сортов" },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-xs text-[rgba(245,240,232,0.35)] mb-1">{f.label}</p>
                    <p className="text-sm font-medium text-[#f5f0e8]">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Правая — ценности */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl bg-[#161411] border border-white/[0.06] p-5 sm:p-6 hover:border-[#c9a96e]/20 transition-colors duration-300 group"
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#c9a96e]/[0.08] flex items-center justify-center mb-4 group-hover:bg-[#c9a96e]/[0.14] transition">
                  {v.icon}
                </div>
                <h3 className="text-sm font-semibold text-[#f5f0e8] mb-2">{v.title}</h3>
                <p className="text-xs leading-relaxed text-[rgba(245,240,232,0.45)]">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
