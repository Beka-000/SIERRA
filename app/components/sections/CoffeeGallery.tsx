"use client";

import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

export default function CoffeeGallery() {
  const { locale } = useLocale();
  const i18n = t(locale);

  const images = [
    {
      url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=800&auto=format&fit=crop",
      alt: "Espresso",
      span: "col-span-2 row-span-2",
    },
    {
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
      alt: "Cappuccino",
      span: "col-span-1 row-span-1",
    },
    {
      url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop",
      alt: "Coffee Shop Interior",
      span: "col-span-1 row-span-1",
    },
    {
      url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
      alt: "Latte Art",
      span: "col-span-1 row-span-2",
    },
    {
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
      alt: "Fresh Pastry",
      span: "col-span-1 row-span-1",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0d0b] via-[#1a1512] to-[#0f0d0b]" />
      
      {/* Subtle wood texture */}
      <div className="absolute inset-0 wood-texture opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {locale === "ru"
              ? "Создано с любовью к кофе"
              : locale === "ky"
              ? "Кофего сүйүү менен жаратылган"
              : "Crafted with Love for Coffee"}
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[rgba(245,240,232,0.6)]">
            {locale === "ru"
              ? "От первого аромата свежемолотых зёрен до последнего глотка — мы создаём пространство, в которое хочется возвращаться."
              : locale === "ky"
              ? "Жаңы майдаланган даандардын биринчи жыттанышынан акыркы тамчысына чейин — биз кайтып келгиңиз келген мейкиндикти жаратабыз."
              : "From the first aroma of freshly ground beans to the last sip — we create a space you'll want to return to."}
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {images.map((image, index) => (
            <div
              key={index}
              className={`${image.span} group relative overflow-hidden rounded-2xl bg-[#161411]`}
              style={{
                minHeight: image.span.includes("row-span-2") ? "400px" : "190px",
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0b]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-white font-medium">{image.alt}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coffee beans decoration */}
        <div className="flex justify-center items-center gap-2 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#c9a96e]"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
