"use client";

import { useLocale } from "@/lib/LocaleContext";

export default function Atmosphere() {
  const { locale } = useLocale();

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: locale === "ru" ? "Уютное пространство" : locale === "ky" ? "Жайлуу мейкиндик" : "Cozy Space",
      desc: locale === "ru"
        ? "Мягкие кресла, тёплый свет и деревянные акценты"
        : locale === "ky"
        ? "Жумшак креслолор, жылуу жарык жана жыгач акценттер"
        : "Soft armchairs, warm light and wooden accents",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 12h20v2a10 10 0 01-20 0v-2z"/>
          <path d="M10 12V8a6 6 0 0112 0v4"/>
        </svg>
      ),
      title: locale === "ru" ? "Свежий кофе" : locale === "ky" ? "Жаңы кофе" : "Fresh Coffee",
      desc: locale === "ru"
        ? "Каждая чашка готовится с заботой и мастерством"
        : locale === "ky"
        ? "Ар бир чыны кам-көрүү жана чеберчилик менен даярдалат"
        : "Every cup is crafted with care and expertise",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      title: locale === "ru" ? "С 8:00 до 22:00" : locale === "ky" ? "08:00дөн 22:00гө чейин" : "8 AM to 10 PM",
      desc: locale === "ru"
        ? "Открыты каждый день для вашего утреннего и вечернего кофе"
        : locale === "ky"
        ? "Эртең менен жана кечки кофеңиз үчүн күн сайын ачыкпыз"
        : "Open every day for your morning and evening coffee",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
      title: locale === "ru" ? "Для работы и встреч" : locale === "ky" ? "Иш жана жолугушуулар үчүн" : "For Work & Meetings",
      desc: locale === "ru"
        ? "Стабильный Wi-Fi, розетки и спокойная атмосфера"
        : locale === "ky"
        ? "Туруктуу Wi-Fi, розеткалар жана тынч атмосфера"
        : "Stable Wi-Fi, power outlets and calm atmosphere",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background with image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 bg-[#0f0d0b]/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0d0b] via-[#0f0d0b]/50 to-[#0f0d0b]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {locale === "ru"
                ? "Здесь хочется остаться"
                : locale === "ky"
                ? "Бул жерде калгың келет"
                : "A Place to Stay"}
            </h2>
            <p className="text-lg text-[rgba(245,240,232,0.6)] mb-12">
              {locale === "ru"
                ? "Sierra Coffee — это не просто кофейня. Это место, где можно работать, встречаться с друзьями, читать книгу или просто наслаждаться моментом с чашкой идеального кофе."
                : locale === "ky"
                ? "Sierra Coffee — бул жөн гана кофекана эмес. Бул иштесе, досторуңуз менен жолугушса, китеп окуса же мыкты кофе менен учурдан ырахат алса болот."
                : "Sierra Coffee is more than just a coffee shop. It's a place where you can work, meet friends, read a book, or simply enjoy the moment with a cup of perfect coffee."}
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center text-[#c9a96e]">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-[rgba(245,240,232,0.5)]">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12">
              <a href="#booking" className="btn-gold">
                {locale === "ru"
                  ? "Забронировать столик"
                  : locale === "ky"
                  ? "Столду брондоо"
                  : "Book a Table"}
              </a>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-[#161411] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=800&auto=format&fit=crop"
                alt="Coffee and atmosphere"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-[#c9a96e]/10 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-[#c9a96e]/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
