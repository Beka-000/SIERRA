export default function BookingCta() {
  return (
    <section id="booking" className="relative py-28 overflow-hidden">
      {/* Верхний разделитель */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent" />

      {/* Фон с зернистостью */}
      <div className="absolute inset-0 bg-[#c9a96e]/[0.025]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #c9a96e 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Большой декор-круг */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#c9a96e]/[0.07] pointer-events-none" />
      <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-[#c9a96e]/[0.1] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Левая часть — текст */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#c9a96e] mb-4">
              Бронирование
            </p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Забронируйте столик заранее
            </h2>
            <p className="text-[rgba(245,240,232,0.5)] text-lg leading-relaxed mb-10">
              Зарезервируйте место для романтического ужина, деловой встречи
              или дружеских посиделок. Подтверждение придёт сразу после
              оформления брони.
            </p>

            {/* Преимущества */}
            <ul className="space-y-4 mb-10">
              {[
                "Онлайн-подтверждение за 5 минут",
                "Отмена бронирования без штрафа за 2 часа",
                "Столики в разных зонах: окно, центр, уголок",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/25 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="text-sm text-[rgba(245,240,232,0.6)]">{item}</span>
                </li>
              ))}
            </ul>

            <a href="/booking" className="btn-gold">
              Забронировать столик
            </a>
          </div>

          {/* Правая часть — мини-форма-карточка */}
          <div className="rounded-2xl bg-[#161411] border border-white/[0.07] p-8">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent" />

            <h3 className="text-base font-semibold text-[#f5f0e8] mb-6">Быстрая бронь</h3>

            <div className="space-y-4">
              {/* Имя */}
              <div>
                <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                  Ваше имя
                </label>
                <input
                  type="text"
                  placeholder="Айдана Касымова"
                  className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#f5f0e8] placeholder-[rgba(245,240,232,0.2)] px-4 text-sm outline-none focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/10 transition"
                />
              </div>

              {/* Телефон */}
              <div>
                <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                  Телефон
                </label>
                <input
                  type="tel"
                  placeholder="+7 (700) 000-00-00"
                  className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#f5f0e8] placeholder-[rgba(245,240,232,0.2)] px-4 text-sm outline-none focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/10 transition"
                />
              </div>

              {/* Дата + Время */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                    Дата
                  </label>
                  <input
                    type="date"
                    className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[rgba(245,240,232,0.7)] px-4 text-sm outline-none focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/10 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[rgba(245,240,232,0.4)] mb-1.5 uppercase tracking-wider">
                    Гостей
                  </label>
                  <select className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[rgba(245,240,232,0.7)] px-4 text-sm outline-none focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/10 transition [color-scheme:dark]">
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? "гость" : n < 5 ? "гостя" : "гостей"}</option>
                    ))}
                  </select>
                </div>
              </div>

              <a href="/booking" className="btn-gold w-full block text-center mt-2">
                Проверить доступность
              </a>
            </div>

            <p className="mt-4 text-xs text-center text-[rgba(245,240,232,0.25)]">
              Нажимая кнопку, вы соглашаетесь с условиями обработки данных
            </p>
          </div>

        </div>
      </div>

      {/* Нижний разделитель */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent" />
    </section>
  );
}
