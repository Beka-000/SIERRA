"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useCart } from "@/lib/CartContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

export default function CartPage() {
  const router = useRouter();
  const { items, itemCount, totalAmount, updateQuantity, removeItem, loading } = useCart();
  const { locale } = useLocale();
  const i18n = t(locale);

  useEffect(() => {
    // Прокрутка вверх при загрузке
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs sm:text-sm text-white/40">Загрузка корзины...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Пустая корзина
  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center py-16 sm:py-20">
              {/* Иконка пустой корзины */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <svg className="w-9 h-9 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.3)" strokeWidth="1.5">
                  <path d="M9 2L7 6M17 2l2 4M21 6H3M5 6h14l-1 14H6L5 6z"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-[#f5f0e8] mb-3 px-4">
                Ваша корзина пуста
              </h1>
              <p className="text-sm sm:text-base text-[rgba(245,240,232,0.6)] mb-6 sm:mb-8 px-4">
                Добавьте товары из меню, чтобы оформить заказ
              </p>

              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 h-12 sm:h-12 px-6 sm:px-8 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Перейти в меню
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Корзина с товарами
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Заголовок */}
          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Корзина
            </h1>
            <p className="text-[rgba(245,240,232,0.6)]">
              {itemCount} {itemCount === 1 ? "товар" : itemCount < 5 ? "товара" : "товаров"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Список товаров */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] transition"
                >
                  <div className="flex gap-4">
                    {/* Фото товара */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-24 h-24 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-white/[0.04] shrink-0 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.2)" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}

                    {/* Информация о товаре */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-[#f5f0e8] mb-1">
                        {item.title}
                      </h3>
                      {item.weightOrVolume && (
                        <p className="text-sm text-[rgba(245,240,232,0.4)] mb-3">
                          {item.weightOrVolume}
                        </p>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Управление количеством */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center transition"
                            aria-label="Уменьшить количество"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                          </button>
                          
                          <span className="text-[#f5f0e8] font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center transition"
                            aria-label="Увеличить количество"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                          </button>
                        </div>

                        {/* Цена */}
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold text-[#c9a96e]">
                            {(item.price * item.quantity).toLocaleString("ru-KG")} с
                          </p>
                          
                          {/* Кнопка удаления */}
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition"
                            aria-label="Удалить товар"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Итоговая сумма */}
            <div className="lg:col-span-1">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                  Итого
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[rgba(245,240,232,0.6)]">
                    <span>Товары ({itemCount})</span>
                    <span>{totalAmount.toLocaleString("ru-KG")} с</span>
                  </div>
                  <div className="flex justify-between text-[rgba(245,240,232,0.6)]">
                    <span>Доставка</span>
                    <span>Бесплатно</span>
                  </div>
                  <div className="h-px bg-white/[0.08]" />
                  <div className="flex justify-between text-lg font-semibold text-[#f5f0e8]">
                    <span>Итого</span>
                    <span className="text-[#c9a96e]">{totalAmount.toLocaleString("ru-KG")} с</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full h-12 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition mb-3"
                >
                  Оформить заказ
                </button>

                <Link
                  href="/menu"
                  className="block w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.08] transition flex items-center justify-center"
                >
                  Продолжить покупки
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
