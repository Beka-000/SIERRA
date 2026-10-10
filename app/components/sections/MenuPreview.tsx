const categories = ["Кофе", "Чай и напитки", "Завтраки", "Десерты"];

const items = [
  {
    category: "Кофе",
    name:     "Флэт уайт",
    desc:     "Двойной эспрессо с нежным молоком — идеальный баланс крепости и мягкости",
    price:    140,
    badge:    "Хит",
    emoji:    "☕",
  },
  {
    category: "Кофе",
    name:     "Капучино",
    desc:     "Классический итальянский капучино с пышной молочной пенкой",
    price:    120,
    badge:    null,
    emoji:    "☕",
  },
  {
    category: "Завтраки",
    name:     "Авокадо-тост",
    desc:     "Хрустящий бриошь, крем-авокадо, яйцо пашот, микрозелень",
    price:    280,
    badge:    "Популярное",
    emoji:    "🥑",
  },
  {
    category: "Завтраки",
    name:     "Ореховая каша",
    desc:     "Овсяная каша на кокосовом молоке с карамелизированными орехами",
    price:    180,
    badge:    null,
    emoji:    "🌾",
  },
  {
    category: "Десерты",
    name:     "Тарт с лимоном",
    desc:     "Хрустящее тесто, шёлковый лимонный крем, итальянская меренга",
    price:    160,
    badge:    "Новинка",
    emoji:    "🍋",
  },
  {
    category: "Чай и напитки",
    name:     "Матча латте",
    desc:     "Японский церемониальный матча с овсяным молоком и мёдом",
    price:    150,
    badge:    "Хит",
    emoji:    "🍵",
  },
];

export default function MenuPreview() {
  return (
    <section id="menu" className="relative py-28">
      {/* Фоновый акцент */}
      <div className="absolute left-0 top-1/3 w-72 h-72 rounded-full bg-[#c9a96e]/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">

        {/* Шапка */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-widest uppercase text-[#c9a96e] mb-4">
              Меню
            </p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Попробуйте лучшее
            </h2>
          </div>
          <a href="/menu" className="btn-outline shrink-0">
            Полное меню →
          </a>
        </div>

        {/* Категории */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-4 py-1.5 rounded-full text-sm border border-white/[0.08] text-[rgba(245,240,232,0.5)] hover:border-[#c9a96e]/40 hover:text-[#c9a96e] cursor-pointer transition"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Карточки */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.name}
              className="group relative rounded-2xl bg-[#161411] border border-white/[0.06] p-6 hover:border-[#c9a96e]/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Бейдж */}
              {item.badge && (
                <span className="absolute top-5 right-5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/25">
                  {item.badge}
                </span>
              )}

              {/* Эмодзи */}
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-2xl mb-5">
                {item.emoji}
              </div>

              {/* Категория */}
              <p className="text-xs text-[rgba(245,240,232,0.35)] mb-1.5">{item.category}</p>

              {/* Название */}
              <h3 className="text-base font-semibold text-[#f5f0e8] mb-2">{item.name}</h3>

              {/* Описание */}
              <p className="text-xs leading-relaxed text-[rgba(245,240,232,0.45)] mb-5">
                {item.desc}
              </p>

              {/* Цена + кнопка */}
              <div className="flex items-center justify-between">
                <span
                  className="text-lg font-semibold text-[#c9a96e]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.price.toLocaleString("ru-KG")} с
                </span>
                <button
                  className="w-8 h-8 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] flex items-center justify-center hover:bg-[#c9a96e] hover:text-[#0f0d0b] transition"
                  aria-label={`Добавить ${item.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Нижняя CTA */}
        <div className="mt-12 text-center">
          <a href="/menu" className="btn-gold">
            Смотреть всё меню
          </a>
        </div>
      </div>
    </section>
  );
}
