const contactItems = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: "Адрес",
    value: "пр. Чуй 154, Бишкек",
    sub:   "Ориентир: центр города, рядом с площадью Ала-Тоо",
    href:  "https://maps.google.com",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    label: "Режим работы",
    value: "Ежедневно 08:00 – 22:00",
    sub:   "Без перерывов и выходных",
    href:  null,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
      </svg>
    ),
    label: "Телефон",
    value: "+996 (555) 000-000",
    sub:   "Звонки и WhatsApp",
    href:  "tel:+996555000000",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email",
    value: "hello@sierracoffee.kg",
    sub:   "Ответим в течение дня",
    href:  "mailto:hello@sierracoffee.kg",
  },
];

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: "https://t.me",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
      </svg>
    ),
  },
  {
    label: "2GIS",
    href: "https://2gis.kz",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
      </svg>
    ),
  },
];

export default function Contacts() {
  return (
    <section id="contacts" className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">

        {/* Шапка */}
        <div className="max-w-xl mb-14">
          <p className="text-xs font-medium tracking-widest uppercase text-[#c9a96e] mb-4">
            Контакты
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Приходите в гости
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* Контактные карточки */}
          <div className="grid sm:grid-cols-2 gap-4">
            {contactItems.map((item) => {
              const Wrapper = item.href ? "a" : "div";
              return (
                <Wrapper
                  key={item.label}
                  {...(item.href ? { href: item.href, target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="rounded-2xl bg-[#161411] border border-white/[0.06] p-6 hover:border-[#c9a96e]/20 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/[0.08] flex items-center justify-center mb-4 group-hover:bg-[#c9a96e]/[0.14] transition">
                    {item.icon}
                  </div>
                  <p className="text-xs text-[rgba(245,240,232,0.35)] mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-[#f5f0e8] mb-0.5">{item.value}</p>
                  <p className="text-xs text-[rgba(245,240,232,0.35)]">{item.sub}</p>
                </Wrapper>
              );
            })}

            {/* Соцсети */}
            <div className="sm:col-span-2 rounded-2xl bg-[#161411] border border-white/[0.06] p-6">
              <p className="text-xs text-[rgba(245,240,232,0.35)] mb-4">Мы в социальных сетях</p>
              <div className="flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[rgba(245,240,232,0.4)] flex items-center justify-center hover:border-[#c9a96e]/30 hover:text-[#c9a96e] transition"
                  >
                    {s.icon}
                  </a>
                ))}
                <span className="ml-2 text-sm text-[rgba(245,240,232,0.3)]">
                  @sierracoffee.kg
                </span>
              </div>
            </div>
          </div>

          {/* Карта-заглушка */}
          <div className="rounded-2xl bg-[#161411] border border-white/[0.06] overflow-hidden min-h-[360px] flex flex-col">
            {/* Заголовок карты */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#c9a96e]" />
                <span className="text-sm text-[rgba(245,240,232,0.6)]">Sierra Coffee на карте</span>
              </div>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#c9a96e] hover:text-[#d4b87a] transition"
              >
                Открыть в Google Maps →
              </a>
            </div>

            {/* Плейсхолдер карты */}
            <div className="flex-1 flex items-center justify-center bg-[#0f0d0b] relative">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, #c9a96e 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative flex flex-col items-center gap-3 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#f5f0e8]">ул. Достык 12, Алматы</p>
                  <p className="text-xs text-[rgba(245,240,232,0.35)] mt-0.5">Рядом со станцией метро «Достык»</p>
                </div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mt-2"
                  style={{ height: "36px", padding: "0 16px", fontSize: "0.75rem" }}
                >
                  Построить маршрут
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
