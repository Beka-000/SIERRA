"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

const LeafletMap = dynamic(() => import("@/app/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <ContactsMapLoading />
  ),
});

function ContactsMapLoading() {
  const { locale } = useLocale();
  const i18n = t(locale);
  return (
    <div className="flex-1 flex items-center justify-center bg-[#17130F] min-h-[300px]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-8 h-8 border-2 border-[#D9B66F]/30 border-t-[#D9B66F] rounded-full animate-spin" />
        <p className="text-xs text-[#B8AA98]">{i18n.contacts.mapLoading}</p>
      </div>
    </div>
  );
}

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com/sierracoffee.kg",
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
    href: "https://t.me/sierracoffeekg",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
      </svg>
    ),
  },
  {
    label: "2GIS",
    href: "https://2gis.kg/bishkek",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
      </svg>
    ),
  },
];

export default function Contacts() {
  const { locale } = useLocale();
  const i18n = t(locale);

  const contactItems = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9B66F" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      label: i18n.contacts.addressLabel,
      value: i18n.contacts.addressValue,
      sub:   i18n.contacts.addressSub,
      href:  "https://maps.google.com/maps?q=42.8746,74.5698",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9B66F" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
      label: i18n.contacts.scheduleLabel,
      value: i18n.contacts.scheduleValue,
      sub:   i18n.contacts.scheduleSub,
      href:  null as string | null,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9B66F" strokeWidth="1.5">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
        </svg>
      ),
      label: i18n.contacts.phoneLabel,
      value: i18n.contacts.phoneValue,
      sub:   i18n.contacts.phoneSub,
      href:  "tel:+996555000000" as string | null,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9B66F" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      label: i18n.contacts.emailLabel,
      value: i18n.contacts.emailValue,
      sub:   i18n.contacts.emailSub,
      href:  "mailto:hello@sierracoffee.kg" as string | null,
    },
  ];

  return (
    <section id="contacts" className="relative py-24 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="max-w-xl mb-12 sm:mb-14">
          <p className="text-xs font-medium tracking-widest uppercase text-[#D9B66F] mb-4">
            {i18n.contacts.label}
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold text-[#F7F1E8] leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {i18n.contacts.title}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">

          {/* Левая — контактные карточки */}
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {contactItems.map((item) => {
                const Wrapper = item.href ? "a" : "div";
                return (
                  <Wrapper
                    key={item.label}
                    {...(item.href
                      ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="rounded-2xl bg-[#211A15] border border-white/[0.07] p-5 hover:border-[#D9B66F]/25 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#D9B66F]/[0.08] flex items-center justify-center mb-4 group-hover:bg-[#D9B66F]/[0.14] transition">
                      {item.icon}
                    </div>
                    <p className="text-xs text-[#B8AA98]/60 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-[#F7F1E8] mb-0.5">{item.value}</p>
                    <p className="text-xs text-[#B8AA98]/60">{item.sub}</p>
                  </Wrapper>
                );
              })}
            </div>

            {/* Соцсети */}
            <div className="rounded-2xl bg-[#211A15] border border-white/[0.07] p-5">
              <p className="text-xs text-[#B8AA98]/60 mb-4">{i18n.contacts.socialsLabel}</p>
              <div className="flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#B8AA98]/50 flex items-center justify-center hover:border-[#D9B66F]/30 hover:text-[#D9B66F] transition"
                  >
                    {s.icon}
                  </a>
                ))}
                <span className="ml-2 text-sm text-[#B8AA98]/40">{i18n.contacts.socialsHandle}</span>
              </div>
            </div>
          </div>

          {/* Правая — карта */}
          <div className="rounded-2xl bg-[#211A15] border border-white/[0.07] overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D9B66F]" />
                <span className="text-sm text-[#B8AA98]">{i18n.contacts.mapTitle}</span>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=42.8746,74.5698"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#D9B66F] hover:text-[#e8c87a] transition"
              >
                {i18n.contacts.mapBtn}
              </a>
            </div>
            <div className="flex-1 relative">
              <LeafletMap />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
