"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { SkeletonTable } from "../components/ui/Skeleton";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [page, status, fulfillmentType, paymentMethod]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search && { search }),
        ...(status && { status }),
        ...(fulfillmentType && { fulfillmentType }),
        ...(paymentMethod && { paymentMethod }),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("[Orders Fetch Error]", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchOrders();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Заказы</h1>
          <p className="text-sm text-white/40 mt-1">
            {total} {total === 1 ? "заказ" : total < 5 ? "заказа" : "заказов"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Поиск по номеру, имени, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "Все статусы" },
              { value: "NEW", label: "Новые" },
              { value: "CONFIRMED", label: "Подтверждённые" },
              { value: "COOKING", label: "Готовятся" },
              { value: "READY", label: "Готовы" },
              { value: "OUT_FOR_DELIVERY", label: "В доставке" },
              { value: "COMPLETED", label: "Завершённые" },
              { value: "CANCELLED", label: "Отменённые" },
            ]}
          />

          <Select
            value={fulfillmentType}
            onChange={(e) => setFulfillmentType(e.target.value)}
            options={[
              { value: "", label: "Все типы" },
              { value: "dine_in", label: "В заведении" },
              { value: "pickup", label: "Самовывоз" },
              { value: "delivery", label: "Доставка" },
            ]}
          />

          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "", label: "Все способы оплаты" },
              { value: "cash", label: "Наличные" },
              { value: "card", label: "Карта" },
              { value: "online", label: "Онлайн" },
            ]}
          />
        </form>

        {(search || status || fulfillmentType || paymentMethod) && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("");
                setFulfillmentType("");
                setPaymentMethod("");
                setPage(1);
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={10} columns={7} />
      ) : (
        <Table
          columns={[
            {
              key: "orderNumber",
              label: "Номер",
              width: "120px",
              render: (row) => (
                <span className="font-mono text-[#c9a96e]">#{row.orderNumber}</span>
              ),
            },
            {
              key: "customerName",
              label: "Клиент",
              render: (row) => (
                <div>
                  <p className="text-sm text-white">{row.customerName}</p>
                  <p className="text-xs text-white/40">{row.customerPhone}</p>
                </div>
              ),
            },
            {
              key: "fulfillmentType",
              label: "Тип",
              render: (row) => (
                <span className="text-sm text-white/60">
                  {fulfillmentLabels[row.fulfillmentType] || row.fulfillmentType}
                </span>
              ),
            },
            {
              key: "items",
              label: "Товары",
              render: (row) => (
                <span className="text-sm text-white/60">{row.items?.length || 0} шт</span>
              ),
            },
            {
              key: "totalAmount",
              label: "Сумма",
              align: "right",
              render: (row) => (
                <span className="text-sm font-semibold text-white">
                  {row.totalAmount.toLocaleString("ru-KG")} с
                </span>
              ),
            },
            {
              key: "status",
              label: "Статус",
              render: (row) => (
                <Badge variant={statusVariants[row.status] || "default"}>
                  {statusLabels[row.status] || row.status}
                </Badge>
              ),
            },
            {
              key: "createdAt",
              label: "Создан",
              render: (row) => (
                <span className="text-xs text-white/40">
                  {new Date(row.createdAt).toLocaleString("ru-KG", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ),
            },
          ]}
          data={orders}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
          emptyMessage="Заказы не найдены"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-white/40">
            Страница {page} из {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Назад
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
