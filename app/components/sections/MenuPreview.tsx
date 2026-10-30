"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useToast } from "@/lib/ToastContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

interface Category {
  id: string;
  title: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl?: string | null;
  weightOrVolume?: string | null;
  isRecommended: boolean;
  category: { id: string; title: string };
}

export default function MenuPreview() {
  const { locale } = useLocale();
  const i18n = t(locale);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const categoriesRes = await fetch("/api/categories");
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories?.slice(0, 4) || []);

        // Сначала пробуем получить рекомендованные товары (isRecommended = true)
        const recommendedRes = await fetch("/api/products?recommended=true&limit=6");
        const recommendedData = await recommendedRes.json();

        if (recommendedData.products?.length > 0) {
          setProducts(recommendedData.products);
        } else {
          // Фоллбэк: если нет рекомендованных — берём первые 6 доступных товаров
          const fallbackRes = await fetch("/api/products?sortBy=recommended&limit=6");
          const fallbackData = await fallbackRes.json();
          setProducts(fallbackData.products || []);
        }
      } catch (error) {
        console.error("Failed to load menu preview:", error);
      }
    }
    loadData();
  }, []);

  return (
    <section id="menu" className="relative py-28">
      <div className="absolute left-0 top-1/3 w-72 h-72 rounded-full bg-[#c9a96e]/[0.04] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">

        {/* Шапка */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-widest uppercase text-[#c9a96e] mb-4">
              {i18n.menu.label}
            </p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {i18n.menu.title}
            </h2>
          </div>
          <a href="/menu" className="btn-outline shrink-0">
            {i18n.menu.fullMenuBtn}
          </a>
        </div>

        {/* Категории */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/menu?categoryId=${cat.id}`}
              className="px-4 py-1.5 rounded-full text-sm border border-white/[0.08] text-[rgba(245,240,232,0.5)] hover:border-[#c9a96e]/40 hover:text-[#c9a96e] cursor-pointer transition"
            >
              {cat.title}
            </Link>
          ))}
        </div>

        {/* Карточки */}
        {products.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#161411] border border-white/[0.06] p-6 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] mb-5" />
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-full mb-5" />
                <div className="h-6 bg-white/5 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((item) => (
              <Link
                key={item.id}
                href={`/menu/${item.id}`}
                className="group relative rounded-2xl bg-[#161411] border border-white/[0.06] p-6 hover:border-[#c9a96e]/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                {item.isRecommended && (
                  <span className="absolute top-5 right-5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/25">
                    {i18n.menu.badgeHit}
                  </span>
                )}

                <div className="w-full h-44 rounded-xl overflow-hidden mb-5 bg-white/[0.03]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // URL недоступен — скрываем img, родитель покажет заглушку
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    // Заглушка когда изображения нет
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[rgba(245,240,232,0.35)] mb-1.5">
                  {item.category.title}
                </p>

                <h3 className="text-base font-semibold text-[#f5f0e8] mb-2 group-hover:text-[#c9a96e] transition">
                  {item.title}
                </h3>

                <p className="text-xs leading-relaxed text-[rgba(245,240,232,0.45)] mb-5 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className="text-lg font-semibold text-[#c9a96e]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.price} {i18n.menu.currency}
                  </span>
                  <button
                    className="w-8 h-8 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] flex items-center justify-center hover:bg-[#c9a96e] hover:text-[#0f0d0b] transition"
                    aria-label={`${i18n.menu.addToCart} ${item.title}`}
                    onClick={(e) => {
                      e.preventDefault();
                      addItem({
                        productId:      item.id,
                        title:          item.title,
                        price:          item.price,
                        imageUrl:       item.imageUrl ?? null,
                        weightOrVolume: item.weightOrVolume ?? null,
                      });
                      showToast("success", `${item.title} ${i18n.menu.addedToCart}`);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/menu" className="btn-gold">
            {i18n.menu.viewAllBtn}
          </Link>
        </div>
      </div>
    </section>
  );
}
