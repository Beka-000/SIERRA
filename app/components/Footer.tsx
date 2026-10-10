const footerLinks = [
  {
    title: "Меню",
    links: [
      { label: "Кофе",         href: "/menu#coffee" },
      { label: "Чай и напитки",href: "/menu#tea" },
      { label: "Завтраки",     href: "/menu#breakfast" },
      { label: "Десерты",      href: "/menu#desserts" },
    ],
  },
  {
    title: "Сервис",
    links: [
      { label: "Онлайн-заказ",     href: "/menu" },
      { label: "Бронирование",     href: "/booking" },
      { label: "Доставка",         href: "/delivery" },
      { label: "Программа лояльности", href: "/loyalty" },
    ],
  },
  {
    title: "О компании",
    links: [
      { label: "О нас",        href: "/#about" },
      { label: "Контакты",     href: "/#contacts" },
      { label: "Вакансии",     href: "/careers" },
      { label: "Франшиза",     href: "/franchise" },
    ],
  },
];

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#0c0a08]">
      {/* Верхняя золотая линия */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">

          {/* Бренд */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                  <path d="M6 12h20v2a10 10 0 01-20 0v-2z" stroke="#c9a96e" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M10 12V8a6 6 0 0112 0v4" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 24v3M22 24v3M8 27h16" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span
                className="text-lg font-semibold text-[#f5f0e8]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sierra Coffee
              </span>
            </div>

            <p className="text-sm leading-relaxed text-[rgba(245,240,232,0.4)] max-w-xs mb-6">
              Уютная кофейня в Бишкеке. Авторский кофе, свежая выпечка
              и атмосфера, в которой хочется задержаться.
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
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] text-[rgba(245,240,232,0.35)] flex items-center justify-center hover:border-[#c9a96e]/30 hover:text-[#c9a96e] transition"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Ссылки */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(245,240,232,0.3)] mb-5">
                {group.title}
              </p>
              <ul className="space-y-3">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-[rgba(245,240,232,0.45)] hover:text-[#f5f0e8] transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Нижняя строка */}
        <div className="mt-14 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[rgba(245,240,232,0.25)]">
            © {year} Sierra Coffee. Все права защищены.
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: "Политика конфиденциальности", href: "/privacy" },
              { label: "Оферта",                      href: "/terms" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs text-[rgba(245,240,232,0.25)] hover:text-[rgba(245,240,232,0.5)] transition"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
