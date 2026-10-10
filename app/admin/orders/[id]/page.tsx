"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import { useToast } from "@/lib/ToastContext";

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfillmentType: string;
  deliveryAddress: string | null;
  desiredTime: string | null;
  comment: string | null;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    comment: string | null;
    modifiers: any;
    product: {
      id: string;
      title: string;
      price: number;
    } | null;
  }>;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  } | null;
  promocode: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setNewStatus(data.status);
      } else {
        error("Ошибка загрузки", "Не удалось загрузить данные заказа");
      }
    } catch (err) {
      console.error("[Order Fetch Error]", err);
      error("Ошибка", "Не удалось загрузить заказ");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        success("Успешно", "Статус заказа обновлён");
        setStatusModalOpen(false);
        await fetchOrder();
      } else {
        error("Ошибка", "Не удалось обновить статус");
      }
    } catch (err) {
      console.error("[Status Update Error]", err);
      error("Ошибка", "Не удалось обновить статус");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin text-[#c9a96e]"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
            <path d="M21 12a9 9 0 00-9-9" />
          </svg>
          <p className="text-sm text-white/40">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40 mb-4">Заказ не найден</p>
        <Button onClick={() => router.push("/admin/orders")}>Вернуться к списку</Button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    NEW: "Новый",
    CONFIRMED: "Подтверждён",
    COOKING: "Готовится",
    READY: "Готов",
    OUT_FOR_DELIVERY: "В доставке",
    COMPLETED: "Завершён",
    CANCELLED: "Отменён",
  };

  const statusVariants: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
    NEW: "info",
    CONFIRMED: "warning",
    COOKING: "warning",
    READY: "success",
    OUT_FOR_DELIVERY: "info",
    COMPLETED: "success",
    CANCELLED: "error",
  };

  const fulfillmentLabels: Record<string, string> = {
    dine_in: "В заведении",
    pickup: "Самовывоз",
    delivery: "Доставка",
  };

  const paymentLabels: Record<string, string> = {
    cash: "Наличные",
    card: "Карта",
    online: "Онлайн",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/orders")}>
            ← Назад к списку
          </Button>
          <h1 className="text-2xl font-semibold text-white mt-2">
            Заказ <span className="text-[#c9a96e]">#{order.orderNumber}</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Создан {new Date(order.createdAt).toLocaleString("ru-KG")}
          </p>
        </div>
        <Button onClick={() => setStatusModalOpen(true)}>Изменить статус</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Статус</h2>
            <div className="flex items-center gap-4">
              <Badge variant={statusVariants[order.status]} size="md">
                {statusLabels[order.status]}
              </Badge>
              <span className="text-sm text-white/40">
                Обновлён {new Date(order.updatedAt).toLocaleString("ru-KG")}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-medium text-white">Товары</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {item.product?.title || "Товар удалён"}
                      </p>
                      {item.comment && (
                        <p className="text-xs text-white/40 mt-1">Комментарий: {item.comment}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">
                        {item.quantity} × {item.unitPrice.toLocaleString("ru-KG")} с
                      </p>
                      <p className="text-sm font-semibold text-[#c9a96e] mt-1">
                        {item.lineTotal.toLocaleString("ru-KG")} с
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Подитог</span>
                <span className="text-white">{order.subtotal.toLocaleString("ru-KG")} с</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    Скидка {order.promocode ? `(${order.promocode.code})` : ""}
                  </span>
                  <span className="text-emerald-400">
                    -{order.discountAmount.toLocaleString("ru-KG")} с
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-white/[0.06]">
                <span className="text-white">Итого</span>
                <span className="text-[#c9a96e]">{order.totalAmount.toLocaleString("ru-KG")} с</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Клиент</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Имя</p>
                <p className="text-sm text-white">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Телефон</p>
                <p className="text-sm text-white">{order.customerPhone}</p>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-white">{order.customerEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Детали заказа</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Тип</p>
                <p className="text-sm text-white">{fulfillmentLabels[order.fulfillmentType]}</p>
              </div>
              {order.deliveryAddress && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Адрес</p>
                  <p className="text-sm text-white">{order.deliveryAddress}</p>
                </div>
              )}
              {order.desiredTime && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Желаемое время</p>
                  <p className="text-sm text-white">
                    {new Date(order.desiredTime).toLocaleString("ru-KG")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Оплата</p>
                <p className="text-sm text-white">{paymentLabels[order.paymentMethod]}</p>
              </div>
              {order.comment && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Комментарий</p>
                  <p className="text-sm text-white">{order.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Изменить статус заказа"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleStatusUpdate} loading={updating}>
              Сохранить
            </Button>
          </>
        }
      >
        <Select
          label="Новый статус"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          options={[
            { value: "NEW", label: "Новый" },
            { value: "CONFIRMED", label: "Подтверждён" },
            { value: "COOKING", label: "Готовится" },
            { value: "READY", label: "Готов" },
            { value: "OUT_FOR_DELIVERY", label: "В доставке" },
            { value: "COMPLETED", label: "Завершён" },
            { value: "CANCELLED", label: "Отменён" },
          ]}
        />
      </Modal>
    </div>
  );
}
