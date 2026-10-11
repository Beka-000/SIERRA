"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useCart } from "@/lib/CartContext";

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  deliveryType: "delivery" | "pickup";
  address: string;
  comment: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, totalAmount, loading: cartLoading } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "+996",
    email: "",
    deliveryType: "delivery",
    address: "",
    comment: "",
  });

  // Перенаправляем, если корзина пуста
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      router.push("/cart");
    }
  }, [cartLoading, items.length, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[name as keyof CheckoutForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDeliveryTypeChange = (type: "delivery" | "pickup") => {
    setForm((prev) => ({ ...prev, deliveryType: type }));
    // Очищаем адрес и ошибку при выборе самовывоза
    if (type === "pickup") {
      setForm((prev) => ({ ...prev, address: "" }));
      setErrors((prev) => ({ ...prev, address: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    if (!form.name.trim()) {
      newErrors.name = "Введите ваше имя";
    }

    if (!form.phone.trim() || form.phone === "+996") {
      newErrors.phone = "Введите номер телефона";
    } else if (!/^\+996\d{9}$/.test(form.phone)) {
      newErrors.phone = "Формат: +996XXXXXXXXX";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Неверный формат email";
    }

    if (form.deliveryType === "delivery" && !form.address.trim()) {
      newErrors.address = "Введите адрес доставки";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Для гостевых заказов отправляем items из корзины
      const orderData: any = {
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email || undefined,
        deliveryType: form.deliveryType,
        deliveryAddress: form.deliveryType === "delivery" ? form.address : undefined,
        comment: form.comment || undefined,
      };

      // Добавляем items для гостевых заказов
      // Для авторизованных пользователей items берутся из БД
      orderData.items = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        modifiers: item.modifiers || [],
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при создании заказа");
      }

      // Перенаправляем на страницу оплаты Finik Pay
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Если нет URL оплаты, переходим на страницу заказа
        router.push(`/order/${data.orderId}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Ошибка при оформлении заказа");
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-white/40">Загрузка...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return null; // Будет перенаправление
  }

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
              Оформление заказа
            </h1>
            <p className="text-[rgba(245,240,232,0.6)]">
              Заполните данные для доставки
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Форма */}
              <div className="lg:col-span-2 space-y-6">
                {/* Контактные данные */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    Контактные данные
                  </h2>

                  <div className="space-y-4">
                    {/* Имя */}
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        Имя <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        placeholder="Ваше имя"
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.name ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-400 mt-1">{errors.name}</p>
                      )}
                    </div>

                    {/* Телефон */}
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        Телефон <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleInputChange}
                        placeholder="+996XXXXXXXXX"
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.phone ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-400 mt-1">{errors.phone}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        Email (необязательно)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.email ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Способ получения */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    Способ получения
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => handleDeliveryTypeChange("delivery")}
                      className={`p-4 rounded-xl border-2 transition ${
                        form.deliveryType === "delivery"
                          ? "border-[#c9a96e] bg-[#c9a96e]/10"
                          : "border-white/[0.08] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            form.deliveryType === "delivery"
                              ? "border-[#c9a96e]"
                              : "border-white/30"
                          }`}
                        >
                          {form.deliveryType === "delivery" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#c9a96e]" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-[#f5f0e8]">Доставка</p>
                          <p className="text-sm text-[rgba(245,240,232,0.5)]">
                            Бесплатно
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeliveryTypeChange("pickup")}
                      className={`p-4 rounded-xl border-2 transition ${
                        form.deliveryType === "pickup"
                          ? "border-[#c9a96e] bg-[#c9a96e]/10"
                          : "border-white/[0.08] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            form.deliveryType === "pickup"
                              ? "border-[#c9a96e]"
                              : "border-white/30"
                          }`}
                        >
                          {form.deliveryType === "pickup" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#c9a96e]" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-[#f5f0e8]">Самовывоз</p>
                          <p className="text-sm text-[rgba(245,240,232,0.5)]">
                            Из кофейни
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Адрес доставки */}
                  {form.deliveryType === "delivery" && (
                    <div>
                      <label className="block text-sm font-medium text-[rgba(245,240,232,0.7)] mb-2">
                        Адрес доставки <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        placeholder="Улица, дом, квартира"
                        className={`w-full px-4 py-3 bg-[#161411] border ${
                          errors.address ? "border-red-500/50" : "border-white/[0.08]"
                        } rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition`}
                      />
                      {errors.address && (
                        <p className="text-sm text-red-400 mt-1">{errors.address}</p>
                      )}
                    </div>
                  )}

                  {/* Адрес самовывоза */}
                  {form.deliveryType === "pickup" && (
                    <div className="p-4 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20">
                      <p className="text-sm text-[#c9a96e] font-medium mb-2">
                        📍 Адрес кофейни
                      </p>
                      <p className="text-sm text-[rgba(245,240,232,0.7)]">
                        г. Бишкек, ул. Примерная, 123
                      </p>
                      <p className="text-xs text-[rgba(245,240,232,0.5)] mt-2">
                        Время работы: ежедневно с 08:00 до 22:00
                      </p>
                    </div>
                  )}
                </div>

                {/* Комментарий */}
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    Комментарий к заказу
                  </h2>
                  <textarea
                    name="comment"
                    value={form.comment}
                    onChange={handleInputChange}
                    placeholder="Дополнительные пожелания к заказу..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#161411] border border-white/[0.08] rounded-xl text-[#f5f0e8] placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/40 transition resize-none"
                  />
                </div>
              </div>

              {/* Итоговая информация */}
              <div className="lg:col-span-1">
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                    Ваш заказ
                  </h2>

                  {/* Список товаров */}
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/[0.04] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#f5f0e8] truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-[rgba(245,240,232,0.5)]">
                            {item.quantity} × {item.price} с
                          </p>
                        </div>
                        <p className="text-sm font-medium text-[#c9a96e]">
                          {(item.price * item.quantity).toLocaleString("ru-KG")} с
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-white/[0.08] mb-6" />

                  {/* Итоги */}
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
                      <span className="text-[#c9a96e]">
                        {totalAmount.toLocaleString("ru-KG")} с
                      </span>
                    </div>
                  </div>

                  {/* Кнопка оформления */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0f0d0b]/30 border-t-[#0f0d0b] rounded-full animate-spin" />
                        Оформление...
                      </>
                    ) : (
                      <>
                        Перейти к оплате
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </>
                    )}
                  </button>

                  <Link
                    href="/cart"
                    className="block w-full h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.08] transition flex items-center justify-center mt-3"
                  >
                    Вернуться в корзину
                  </Link>

                  {/* Информация об оплате */}
                  <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-[rgba(245,240,232,0.5)] text-center">
                      Безопасная оплата через Finik Pay
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
