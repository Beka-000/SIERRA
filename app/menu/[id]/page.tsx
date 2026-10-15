"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useCart } from "@/lib/CartContext";
import BackButton from "@/app/components/ui/BackButton";

interface Modifier {
  id: string;
  title: string;
  priceDelta: number;
}

interface Review {
  id: string;
  rating: number;
  text: string | null;
  userName: string;
  createdAt: string;
}

interface RelatedProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  weightOrVolume: string | null;
  calories: number | null;
  allergens: string | null;
  composition: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isRecommended: boolean;
  category: {
    id: string;
    title: string;
  };
  modifiers: Modifier[];
  reviews: Review[];
  averageRating: number;
  reviewsCount: number;
  relatedProducts: RelatedProduct[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) {
          router.push("/menu");
          return;
        }
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product:", error);
        router.push("/menu");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      loadProduct();
    }
  }, [params.id, router]);

  const handleModifierToggle = (modifierId: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(modifierId)
        ? prev.filter((id) => id !== modifierId)
        : [...prev, modifierId]
    );
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    const modifiersPrice = product.modifiers
      .filter((m) => selectedModifiers.includes(m.id))
      .reduce((sum, m) => sum + m.priceDelta, 0);
    return (product.price + modifiersPrice) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Вычисляем итоговую цену с модификаторами
    const modifiersPrice = product.modifiers
      .filter((m) => selectedModifiers.includes(m.id))
      .reduce((sum, m) => sum + m.priceDelta, 0);

    const finalPrice = product.price + modifiersPrice;

    // Формируем список выбранных модификаторов для отображения
    const modifiersList = product.modifiers
      .filter((m) => selectedModifiers.includes(m.id))
      .map((m) => m.title);

    // Добавляем товар в корзину
    addItem({
      productId: product.id,
      title: product.title,
      price: finalPrice,
      quantity: quantity,
      imageUrl: product.imageUrl,
      weightOrVolume: product.weightOrVolume,
      modifiers: modifiersList.length > 0 ? modifiersList : undefined,
    });

    // Показываем уведомление
    alert(`${product.title} добавлен в корзину!`);

    // Опционально: перенаправляем в корзину
    // router.push("/cart");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="animate-pulse">
              <div className="h-8 bg-white/5 rounded w-1/3 mb-12" />
              <div className="grid md:grid-cols-2 gap-12">
                <div className="aspect-square bg-white/5 rounded-2xl" />
                <div className="space-y-4">
                  <div className="h-10 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-full" />
                  <div className="h-4 bg-white/5 rounded w-5/6" />
                  <div className="h-12 bg-white/5 rounded w-1/4 mt-8" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Навигация назад */}
          <div className="mb-4 pt-2">
            <BackButton fallback="/menu" label="В меню" />
          </div>
          {/* Хлебные крошки */}
          <nav className="flex items-center gap-2 text-sm mb-12 text-[rgba(245,240,232,0.5)]">
            <Link href="/" className="hover:text-[#c9a96e] transition">
              Главная
            </Link>
            <span>/</span>
            <Link href="/menu" className="hover:text-[#c9a96e] transition">
              Меню
            </Link>
            <span>/</span>
            <Link
              href={`/menu?categoryId=${product.category.id}`}
              className="hover:text-[#c9a96e] transition"
            >
              {product.category.title}
            </Link>
            <span>/</span>
            <span className="text-[#f5f0e8]">{product.title}</span>
          </nav>

          {/* Основная информация */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Изображение */}
            <div className="rounded-2xl bg-[#161411] border border-white/[0.06] overflow-hidden aspect-square">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl">
                  ☕
                </div>
              )}
            </div>

            {/* Информация */}
            <div>
              {/* Бейджи */}
              <div className="flex gap-2 mb-4">
                {product.isRecommended && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/25">
                    Рекомендуем
                  </span>
                )}
                {!product.isAvailable && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                    Нет в наличии
                  </span>
                )}
              </div>

              {/* Название */}
              <h1
                className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {product.title}
              </h1>

              {/* Категория и рейтинг */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-[rgba(245,240,232,0.5)]">
                  {product.category.title}
                </span>
                {product.reviewsCount > 0 && (
                  <>
                    <span className="text-[rgba(245,240,232,0.3)]">•</span>
                    <div className="flex items-center gap-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-[#c9a96e]"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-sm text-[#f5f0e8]">
                        {product.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-[rgba(245,240,232,0.5)]">
                        ({product.reviewsCount})
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Описание */}
              {product.description && (
                <p className="text-[rgba(245,240,232,0.6)] leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              {/* Дополнительная информация */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {product.weightOrVolume && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[#c9a96e]"
                    >
                      <path d="M3 3h18v18H3z" />
                      <path d="M3 9h18" />
                    </svg>
                    <span className="text-[rgba(245,240,232,0.5)]">Объем:</span>
                    <span className="text-[#f5f0e8]">{product.weightOrVolume}</span>
                  </div>
                )}
                {product.calories && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[#c9a96e]"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span className="text-[rgba(245,240,232,0.5)]">Калории:</span>
                    <span className="text-[#f5f0e8]">{product.calories} ккал</span>
                  </div>
                )}
              </div>

              {/* Состав */}
              {product.composition && (
                <div className="mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h3 className="text-sm font-medium text-[#c9a96e] mb-2">Состав:</h3>
                  <p className="text-sm text-[rgba(245,240,232,0.6)]">
                    {product.composition}
                  </p>
                </div>
              )}

              {/* Аллергены */}
              {product.allergens && (
                <div className="mb-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <h3 className="text-sm font-medium text-red-400 mb-2">
                    ⚠️ Аллергены:
                  </h3>
                  <p className="text-sm text-red-400/80">{product.allergens}</p>
                </div>
              )}

              {/* Модификаторы */}
              {product.modifiers.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[#f5f0e8] mb-4">
                    Дополнительно:
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {product.modifiers.map((modifier) => (
                      <label
                        key={modifier.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-[#161411] border border-white/[0.06] cursor-pointer hover:border-[#c9a96e]/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedModifiers.includes(modifier.id)}
                            onChange={() => handleModifierToggle(modifier.id)}
                            className="w-5 h-5 rounded border-white/20 text-[#c9a96e] focus:ring-[#c9a96e] focus:ring-offset-0"
                          />
                          <span className="text-[#f5f0e8]">{modifier.title}</span>
                        </div>
                        <span className="text-[#c9a96e] font-medium">
                          +{modifier.priceDelta} с
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Количество и цена */}
              <div className="flex items-center gap-6 mb-8">
                {/* Количество */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-[#161411] border border-white/[0.08] text-[#f5f0e8] flex items-center justify-center hover:border-[#c9a96e]/40 transition"
                  >
                    −
                  </button>
                  <span className="text-xl font-medium text-[#f5f0e8] w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-[#161411] border border-white/[0.08] text-[#f5f0e8] flex items-center justify-center hover:border-[#c9a96e]/40 transition"
                  >
                    +
                  </button>
                </div>

                {/* Цена */}
                <div className="flex-1">
                  <div className="text-sm text-[rgba(245,240,232,0.5)] mb-1">
                    Итого:
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-3xl font-semibold text-[#c9a96e]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {calculateTotalPrice()} с
                    </span>
                    {product.oldPrice && (
                      <span className="text-lg text-white/30 line-through">
                        {product.oldPrice * quantity} с
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Кнопка добавления в корзину */}
              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className="w-full bg-[#c9a96e] text-[#0f0d0b] font-semibold py-4 px-8 rounded-xl hover:bg-[#d4b77e] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {product.isAvailable ? "Добавить в корзину" : "Нет в наличии"}
              </button>
            </div>
          </div>

          {/* Похожие товары */}
          {product.relatedProducts.length > 0 && (
            <div className="mb-16">
              <h2
                className="text-3xl font-semibold text-[#f5f0e8] mb-8"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Похожие товары
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {product.relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    href={`/menu/${relatedProduct.id}`}
                    className="group rounded-2xl bg-[#161411] border border-white/[0.06] p-5 hover:border-[#c9a96e]/25 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="w-full aspect-square rounded-xl bg-white/[0.02] mb-4 overflow-hidden">
                      {relatedProduct.imageUrl ? (
                        <img
                          src={relatedProduct.imageUrl}
                          alt={relatedProduct.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          ☕
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f0e8] mb-2 group-hover:text-[#c9a96e] transition">
                      {relatedProduct.title}
                    </h3>
                    <p
                      className="text-lg font-semibold text-[#c9a96e]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {relatedProduct.price} с
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Отзывы */}
          {product.reviews.length > 0 && (
            <div>
              <h2
                className="text-3xl font-semibold text-[#f5f0e8] mb-8"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Отзывы ({product.reviewsCount})
              </h2>
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-6 rounded-xl bg-[#161411] border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-[#f5f0e8]">
                        {review.userName}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={i < review.rating ? "currentColor" : "none"}
                            stroke="currentColor"
                            className="text-[#c9a96e]"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-[rgba(245,240,232,0.6)] mb-2">
                        {review.text}
                      </p>
                    )}
                    <p className="text-xs text-[rgba(245,240,232,0.35)]">
                      {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
