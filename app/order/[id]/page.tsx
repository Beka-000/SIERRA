"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackButton from "@/app/components/ui/BackButton";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: string[];
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    weightOrVolume: string | null;
  };
}

interface Payment {
  id: string;
  provider: string;
  status: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfillmentType: string;
  deliveryAddress: string | null;
  comment: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: Payment[];
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  NEW: { label: "Новый", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "🆕" },
  CONFIRMED: { label: "Подтвержден", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: "✓" },
  COOKING: { label: "Готовится", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: "👨‍🍳" },
  READY: { label: "Готов", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: "✓" },
  OUT_FOR_DELIVERY: { label: "В пути", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "🚗" },
  COMPLETED: { label: "Завершен", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: "✓" },
  CANCELLED: { label: "Отменен", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "✕" },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  created: { label: "Создан", color: "text-gray-400" },
  pending: { label: "Ожидание", color: "text-yellow-400" },
  success: { label: "Оплачен", color: "text-green-400" },
  failed: { label: "Ошибка", color: "text-red-400" },
  cancelled: { label: "Отменен", color: "text-gray-400" },
};

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("Заказ не найден");
          } else if (res.status === 403) {
            setError("Доступ запрещен");
          } else {
            setError("Ошибка загрузки заказа");
          }
          return;
        }

        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Ошибка загрузки заказа");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  // Автообновление статуса каждые 10 секунд для активных заказов
  useEffect(() => {
    if (!order || ["COMPLETED", "CANCELLED"].includes(order.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to refresh order:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [order, params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-white/40">Загрузка заказа...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-[#f5f0e8] mb-3">
                {error || "Заказ не найден"}
              </h1>
              <p className="text-[rgba(245,240,232,0.6)] mb-8">
                Проверьте правильность ссылки или обратитесь в поддержку
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition"
              >
                Вернуться в меню
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.NEW;
  const latestPayment = order.payments[0];
  const paymentInfo = latestPayment ? PAYMENT_STATUS_MAP[latestPayment.status] : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0f0d0b] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Заголовок */}
          <div className="mb-8">
            <BackButton fallback="/" label="На главную" className="mb-3" />
            <h1
              className="text-4xl md:text-5xl font-semibold text-[#f5f0e8] mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Заказ #{order.orderNumber}
            </h1>
            <p className="text-[rgba(245,240,232,0.6)]">
              от {new Date(order.createdAt).toLocaleString("ru-RU")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              {/* Статус заказа */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#f5f0e8]">
                    Статус заказа
                  </h2>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>

                {/* Прогресс бар */}
                <div className="space-y-4">
                  {["NEW", "CONFIRMED", "COOKING", "READY", order.fulfillmentType === "delivery" ? "OUT_FOR_DELIVERY" : null, "COMPLETED"].filter(Boolean).map((status, index, arr) => {
                    const isActive = arr.indexOf(order.status) >= index;
                    const isCurrent = order.status === status;
                    const statusConfig = ORDER_STATUS_MAP[status as string];

                    return (
                      <div key={status} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isActive 
                            ? "bg-[#c9a96e] text-[#0f0d0b]" 
                            : "bg-white/[0.06] text-white/30"
                        }`}>
                          {isActive ? "✓" : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isActive ? "text-[#f5f0e8]" : "text-white/40"}`}>
                            {statusConfig?.label}
                          </p>
                        </div>
                        {isCurrent && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#c9a96e] animate-pulse" />
                            <span className="text-xs text-[#c9a96e]">Сейчас</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Товары */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                  Состав заказа
                </h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-white/[0.04] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#f5f0e8] font-medium mb-1">
                          {item.product.title}
                        </h3>
                        {item.product.weightOrVolume && (
                          <p className="text-xs text-[rgba(245,240,232,0.4)] mb-1">
                            {item.product.weightOrVolume}
                          </p>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-xs text-[rgba(245,240,232,0.5)]">
                            + {item.modifiers.join(", ")}
                          </p>
                        )}
                        <p className="text-sm text-[rgba(245,240,232,0.6)] mt-1">
                          {item.quantity} × {item.unitPrice.toLocaleString("ru-KG")} с
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#c9a96e] font-semibold">
                          {item.lineTotal.toLocaleString("ru-KG")} с
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Боковая панель */}
            <div className="lg:col-span-1 space-y-6">
              {/* Информация о доставке */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                  Информация
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[rgba(245,240,232,0.5)] mb-1">Имя</p>
                    <p className="text-[#f5f0e8]">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[rgba(245,240,232,0.5)] mb-1">Телефон</p>
                    <p className="text-[#f5f0e8]">{order.customerPhone}</p>
                  </div>
                  {order.customerEmail && (
                    <div>
                      <p className="text-sm text-[rgba(245,240,232,0.5)] mb-1">Email</p>
                      <p className="text-[#f5f0e8]">{order.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[rgba(245,240,232,0.5)] mb-1">Тип заказа</p>
                    <p className="text-[#f5f0e8]">
                      {order.fulfillmentType === "pickup" ? "Самовывоз" : "Доставка"}
                    </p>
                  </div>
                  {order.deliveryAddress && (
                    <div>
                      <p className="text-sm text-[rgba(245,240,232,0.5)] mb-1">Адрес</p>
                      <p className="text-[#f5f0e8]">{order.deliveryAddress}</p>
                    </div>
                  )}
                  {order.comment && (
                    <div>
                      <p className="text-sm text-[rgba(245,240,232,0.5)] mb-1">Комментарий</p>
                      <p className="text-[#f5f0e8]">{order.comment}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Оплата */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-[#f5f0e8] mb-6">
                  Оплата
                </h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[rgba(245,240,232,0.6)]">
                    <span>Товары</span>
                    <span>{order.subtotal.toLocaleString("ru-KG")} с</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Скидка</span>
                      <span>-{order.discountAmount.toLocaleString("ru-KG")} с</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[rgba(245,240,232,0.6)]">
                    <span>Доставка</span>
                    <span>Бесплатно</span>
                  </div>
                  <div className="h-px bg-white/[0.08]" />
                  <div className="flex justify-between text-lg font-semibold text-[#f5f0e8]">
                    <span>Итого</span>
                    <span className="text-[#c9a96e]">
                      {order.totalAmount.toLocaleString("ru-KG")} с
                    </span>
                  </div>
                </div>

                {paymentInfo && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[rgba(245,240,232,0.6)]">
                        Статус оплаты
                      </span>
                      <span className={`text-sm font-medium ${paymentInfo.color}`}>
                        {paymentInfo.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Действия */}
              <Link
                href="/menu"
                className="block w-full h-12 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold hover:bg-[#d4b87a] transition flex items-center justify-center"
              >
                Вернуться в меню
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
