"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import { useToast } from "@/lib/ToastContext";

// ─── Интерфейсы ──────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  provider: string;
  status: string;
  amount: number;
  providerPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

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
    product: { id: string; title: string; price: number } | null;
  }>;
  payments: Payment[];
  user: { id: string; name: string; email: string | null; phone: string } | null;
  promocode: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

// ─── Словари ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NEW:              "Новый",
  CONFIRMED:        "Подтверждён",
  COOKING:          "Готовится",
  READY:            "Готов",
  OUT_FOR_DELIVERY: "В доставке",
  COMPLETED:        "Завершён",
  CANCELLED:        "Отменён",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  NEW:              "info",
  CONFIRMED:        "warning",
  COOKING:          "warning",
  READY:            "success",
  OUT_FOR_DELIVERY: "info",
  COMPLETED:        "success",
  CANCELLED:        "error",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  created:   "Создан",
  pending:   "Ожидает оплаты",
  success:   "Оплачен",
  failed:    "Ошибка",
  cancelled: "Отменён",
};

const PAYMENT_STATUS_VARIANTS: Record<string, "default" | "success" | "error" | "warning" | "info" | "gold"> = {
  created:   "default",
  pending:   "warning",
  success:   "success",
  failed:    "error",
  cancelled: "default",
};

const FULFILLMENT_LABELS: Record<string, string> = {
  dine_in:  "В заведении",
  pickup:   "Самовывоз",
  delivery: "Доставка",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:   "Наличные",
  card:   "Карта",
  online: "Онлайн",
};

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error } = useToast();

  const [order,          setOrder]          = useState<OrderDetails | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [statusModal,    setStatusModal]    = useState(false);
  const [newStatus,      setNewStatus]      = useState("");
  const [updating,       setUpdating]       = useState(false);
  const [syncingPayment, setSyncingPayment] = useState(false);
  const [syncMessage,    setSyncMessage]    = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (params.id) fetchOrder();
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

  // ── Смена статуса вручную ─────────────────────────────────────────────────

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        success("Успешно", "Статус заказа обновлён");
        setStatusModal(false);
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

  // ── Синхронизация статуса платежа с БД ───────────────────────────────────
  // Исправляет рассинхрон: Payment.status=success, но Order.status=NEW
  // (webhook пришёл, но транзакция заказа не обновилась)

  async function handleSyncPayment() {
    if (!order) return;
    setSyncingPayment(true);
    setSyncMessage(null);
    try {
      const res  = await fetch(`/api/admin/orders/${order.id}/sync-payment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMessage({ ok: false, text: data.message || "Не удалось синхронизировать" });
        return;
      }
      setSyncMessage({ ok: data.synced, text: data.message });
      if (data.synced) await fetchOrder();
    } catch {
      setSyncMessage({ ok: false, text: "Ошибка соединения" });
    } finally {
      setSyncingPayment(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin text-[#c9a96e]"
            width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
            <path d="M21 12a9 9 0 00-9-9"/>
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

  const lastPayment = order.payments?.[0] ?? null;
  const isOnlineOrder = order.paymentMethod === "online";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
        <Button onClick={() => setStatusModal(true)}>Изменить статус</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Основная колонка ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Статус заказа */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Статус заказа</h2>
            <div className="flex items-center gap-4">
              <Badge variant={STATUS_VARIANTS[order.status] ?? "default"} size="md">
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              <span className="text-sm text-white/40">
                Обновлён {new Date(order.updatedAt).toLocaleString("ru-KG")}
              </span>
            </div>
          </div>

          {/* Товары */}
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

          {/* ── Блок платежа (только для онлайн-оплаты) ─────────────────── */}
          {isOnlineOrder && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">Платёж</h2>
                {/* Кнопка синхронизации */}
                <button
                  onClick={handleSyncPayment}
                  disabled={syncingPayment}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium
                             bg-white/[0.04] border border-white/[0.08] text-white/60
                             hover:bg-white/[0.08] hover:text-white disabled:opacity-40
                             disabled:cursor-not-allowed transition"
                  title="Синхронизировать статус заказа с фактическим статусом платежа в БД"
                >
                  {syncingPayment ? (
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                      <path d="M21 12a9 9 0 00-9-9"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6h6M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
                    </svg>
                  )}
                  Синхронизировать
                </button>
              </div>

              {/* Сообщение после синхронизации */}
              {syncMessage && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
                  syncMessage.ok
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-white/[0.04] border-white/[0.08] text-white/60"
                }`}>
                  {syncMessage.text}
                </div>
              )}

              {lastPayment ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">Статус платежа</span>
                    <Badge variant={PAYMENT_STATUS_VARIANTS[lastPayment.status] ?? "default"} size="sm">
                      {PAYMENT_STATUS_LABELS[lastPayment.status] ?? lastPayment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">Провайдер</span>
                    <span className="text-sm text-white capitalize">{lastPayment.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">Сумма</span>
                    <span className="text-sm text-white">{lastPayment.amount.toLocaleString("ru-KG")} с</span>
                  </div>
                  {lastPayment.providerPaymentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 uppercase tracking-wider">ID платежа</span>
                      <span className="text-xs text-white/50 font-mono truncate max-w-[200px]">
                        {lastPayment.providerPaymentId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">Обновлён</span>
                    <span className="text-xs text-white/50">
                      {new Date(lastPayment.updatedAt).toLocaleString("ru-KG")}
                    </span>
                  </div>

                  {/* Подсказка для рассинхрона */}
                  {lastPayment.status === "success" && !["CONFIRMED","COOKING","READY","OUT_FOR_DELIVERY","COMPLETED"].includes(order.status) && (
                    <div className="mt-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                      ⚠ Платёж оплачен, но заказ не подтверждён. Нажмите «Синхронизировать» чтобы исправить.
                    </div>
                  )}
                  {lastPayment.status === "pending" && (
                    <div className="mt-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/40">
                      Ожидаем webhook от Finik Pay. Статус обновится автоматически.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/40">Запись о платеже отсутствует.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Сайдбар ─────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Клиент */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Клиент</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Имя</p>
                <p className="text-sm text-white">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Телефон</p>
                <a href={`tel:${order.customerPhone}`} className="text-sm text-[#c9a96e] hover:underline">
                  {order.customerPhone}
                </a>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-white">{order.customerEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Детали заказа */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Детали заказа</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Тип</p>
                <p className="text-sm text-white">{FULFILLMENT_LABELS[order.fulfillmentType] ?? order.fulfillmentType}</p>
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
                  <p className="text-sm text-white">{new Date(order.desiredTime).toLocaleString("ru-KG")}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Оплата</p>
                <p className="text-sm text-white">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
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

      {/* Модалка смены статуса */}
      <Modal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        title="Изменить статус заказа"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModal(false)}>
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
            { value: "NEW",              label: "Новый"         },
            { value: "CONFIRMED",        label: "Подтверждён"   },
            { value: "COOKING",          label: "Готовится"     },
            { value: "READY",            label: "Готов"         },
            { value: "OUT_FOR_DELIVERY", label: "В доставке"    },
            { value: "COMPLETED",        label: "Завершён"      },
            { value: "CANCELLED",        label: "Отменён"       },
          ]}
        />
      </Modal>
    </div>
  );
}
