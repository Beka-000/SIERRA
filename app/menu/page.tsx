"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useCart } from "@/lib/CartContext";

interface Category {
  id: string;
  title: string;
  description: string | null;
  productsCount: number;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  weightOrVolume: string | null;
  calories: number | null;
  imageUrl: string | null;
  isRecommended: boolean;
  category: {
    id: string;
    title: string;
  };
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(true);
  const { items, addItem, updateQuantity, getItemQuantity } = useCart();

  // Загрузка категорий
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  // Загрузка товаров
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append("categoryId", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);
        if (sortBy) params.append("sortBy", sortBy);
        params.append("limit", "50");

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Заголовок */}
          <div className="mb-12">
            <h1
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Наше меню
            </h1>
            <p className="text-[rgba(245,240,232,0.6)] max-w-2xl">
              Авторские кофейные напитки, свежая выпечка и вкусные десерты
            </p>
          </div>

          {/* Поиск и сортировка */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Поиск */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по меню..."
                  className="w-full px-4 py-3 pl-12 bg-[#161411] border border-white/[0.08] rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
            </form>

            {/* Сортировка */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-[#161411] border border-white/[0.08] rounded-xl text-[#f5f0e8] focus:outline-none focus:border-[#c9a96e]/40 transition cursor-pointer"
            >
              <option value="default">По умолчанию</option>
              <option value="recommended">Рекомендуемые</option>
              <option value="price_asc">Цена: по возрастанию</option>
              <option value="price_desc">Цена: по убыванию</option>
              <option value="name_asc">Название: А-Я</option>
              <option value="name_desc">Название: Я-А</option>
            </select>
          </div>

          {/* Категории */}
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-5 py-2 rounded-full text-sm border transition ${
                selectedCategory === null
                  ? "bg-[#c9a96e] border-[#c9a96e] text-[#0f0d0b] font-medium"
                  : "border-white/[0.08] text-[rgba(245,240,232,0.5)] hover:border-[#c9a96e]/40 hover:text-[#c9a96e]"
              }`}
            >
              Все
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-5 py-2 rounded-full text-sm border transition ${
                  selectedCategory === category.id
                    ? "bg-[#c9a96e] border-[#c9a96e] text-[#0f0d0b] font-medium"
                    : "border-white/[0.08] text-[rgba(245,240,232,0.5)] hover:border-[#c9a96e]/40 hover:text-[#c9a96e]"
                }`}
              >
                {category.title}
                <span className="ml-1.5 opacity-60">({category.productsCount})</span>
              </button>
            ))}
          </div>

          {/* Товары */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#161411] border border-white/[0.06] p-6 animate-pulse"
                >
                  <div className="w-full h-48 bg-white/5 rounded-xl mb-4" />
                  <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-full mb-4" />
                  <div className="h-6 bg-white/5 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/20"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="text-[rgba(245,240,232,0.4)]">
                Товары не найдены. Попробуйте изменить параметры поиска.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/menu/${product.id}`}
                  className="group relative rounded-2xl bg-[#161411] border border-white/[0.06] p-6 hover:border-[#c9a96e]/25 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Бейджи */}
                  <div className="absolute top-5 right-5 flex flex-col gap-2">
                    {product.isRecommended && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/25">
                        Хит
                      </span>
                    )}
                    {product.oldPrice && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                        Скидка
                      </span>
                    )}
                  </div>

                  {/* Изображение */}
                  <div className="w-full aspect-square rounded-xl bg-white/[0.02] mb-5 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        ☕
                      </div>
                    )}
                  </div>

                  {/* Категория */}
                  <p className="text-xs text-[rgba(245,240,232,0.35)] mb-1.5">
                    {product.category.title}
                  </p>

                  {/* Название */}
                  <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2 group-hover:text-[#c9a96e] transition">
                    {product.title}
                  </h3>

                  {/* Описание */}
                  <p className="text-sm leading-relaxed text-[rgba(245,240,232,0.45)] mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Дополнительная информация */}
                  <div className="flex items-center gap-3 mb-5 text-xs text-[rgba(245,240,232,0.35)]">
                    {product.weightOrVolume && (
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3h18v18H3z" />
                          <path d="M3 9h18" />
                        </svg>
                        {product.weightOrVolume}
                      </span>
                    )}
                    {product.calories && (
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        {product.calories} ккал
                      </span>
                    )}
                  </div>

                  {/* Цена и кнопки корзины */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl font-semibold text-[#c9a96e]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {product.price} с
                      </span>
                      {product.oldPrice && (
                        <span className="text-sm text-white/30 line-through">
                          {product.oldPrice} с
                        </span>
                      )}
                    </div>

                    {/* Управление корзиной */}
                    {(() => {
                      const quantity = getItemQuantity(product.id);
                      
                      if (quantity === 0) {
                        return (
                          <button
                            className="w-10 h-10 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] flex items-center justify-center hover:bg-[#c9a96e] hover:text-[#0f0d0b] transition"
                            onClick={(e) => {
                              e.preventDefault();
                              addItem({
                                productId: product.id,
                                title: product.title,
                                price: product.price,
                                quantity: 1,
                                imageUrl: product.imageUrl,
                                weightOrVolume: product.weightOrVolume,
                              });
                            }}
                            aria-label="Добавить в корзину"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        );
                      }

                      return (
                        <div
                          className="flex items-center gap-2 bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-full px-2 py-1"
                          onClick={(e) => e.preventDefault()}
                        >
                          <button
                            className="w-7 h-7 rounded-full bg-[#c9a96e]/20 hover:bg-[#c9a96e]/30 text-[#c9a96e] flex items-center justify-center transition"
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(product.id, quantity - 1);
                            }}
                            aria-label="Уменьшить количество"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <span className="text-sm font-semibold text-[#c9a96e] w-5 text-center">
                            {quantity}
                          </span>
                          <button
                            className="w-7 h-7 rounded-full bg-[#c9a96e]/20 hover:bg-[#c9a96e]/30 text-[#c9a96e] flex items-center justify-center transition"
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(product.id, quantity + 1);
                            }}
                            aria-label="Увеличить количество"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
