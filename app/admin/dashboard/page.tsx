"use client";

import { useEffect, useState } from "react";
import { SkeletonCard } from "../components/ui/Skeleton";
import Chart from "../components/ui/Chart";
import Badge from "../components/ui/Badge";

interface DashboardData {
  period: string;
  stats: {
    totalOrders: number;
    ordersChange: number;
    revenue: number;
    revenueChange: number;
    avgOrderValue: number;
    newCustomers: number;
  };
  statusCounts: Record<string, number>;
  ordersOverTime: { date: string; orders: number; revenue: number }[];
  topProducts: {
    id: string;
    name: string;
    quantity: number;
    orders: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string | null;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("[Dashboard Error]", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40">Не удалось загрузить данные</p>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    NEW: "Новые",
    CONFIRMED: "Подтверждённые",
    COOKING: "Готовятся",
    READY: "Готовы",
    OUT_FOR_DELIVERY: "В доставке",
    COMPLETED: "Завершённые",
    CANCELLED: "Отменённые",
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Обзор показателей бизнеса</p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {[
            { label: "Сегодня", value: "1d" },
            { label: "7 дней", value: "7d" },
            { label: "30 дней", value: "30d" },
            { label: "90 дней", value: "90d" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`h-9 px-4 rounded-lg text-sm font-medium transition ${
                period === p.value
                  ? "bg-[#c9a96e] text-[#0f0d0b]"
                  : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Всего заказов"
          value={data.stats.totalOrders}
          change={data.stats.ordersChange}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          }
        />

        <StatCard
          label="Выручка"
          value={`${data.stats.revenue.toLocaleString("ru-KG")} с`}
          change={data.stats.revenueChange}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
          accent
        />

        <StatCard
          label="Средний чек"
          value={`${Math.round(data.stats.avgOrderValue).toLocaleString("ru-KG")} с`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M9 12h6M12 9v6" />
            </svg>
          }
        />

        <StatCard
          label="Новых клиентов"
          value={data.stats.newCustomers}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders over time */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Заказы по дням</h2>
          <Chart
            data={data.ordersOverTime.map((d) => ({
              label: new Date(d.date).toLocaleDateString("ru", { day: "numeric", month: "short" }),
              value: d.orders,
            }))}
            type="area"
            height={240}
          />
        </div>

        {/* Revenue over time */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-6">Выручка по дням</h2>
          <Chart
            data={data.ordersOverTime.map((d) => ({
              label: new Date(d.date).toLocaleDateString("ru", { day: "numeric", month: "short" }),
              value: d.revenue,
            }))}
            type="line"
            height={240}
          />
        </div>
      </div>

      {/* Content row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <h2 className="text-lg font-medium text-white">Топ товары</h2>
          </div>
          <div className="p-6">
            {data.topProducts.length === 0 ? (
              <p className="text-center text-white/30 py-8 text-sm">Нет данных</p>
            ) : (
              <div className="space-y-4">
                {data.topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#c9a96e]/10 flex items-center justify-center text-[#c9a96e] text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-white/40">
                        {product.quantity} шт · {product.orders} заказов
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#c9a96e]">
                      {product.revenue.toLocaleString("ru-KG")} с
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <h2 className="text-lg font-medium text-white">Последние заказы</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {data.recentOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="px-6 py-4 hover:bg-white/[0.02] transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">#{order.orderNumber}</p>
                  <Badge variant={statusVariants[order.status] || "default"} size="sm">
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
                <p className="text-xs text-white/60 mb-1">{order.customerName}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">
                    {new Date(order.createdAt).toLocaleString("ru-KG")}
                  </p>
                  <p className="text-sm font-semibold text-[#c9a96e]">
                    {order.totalAmount.toLocaleString("ru-KG")} с
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 border ${
        accent
          ? "bg-[#c9a96e]/10 border-[#c9a96e]/25"
          : "bg-white/[0.04] border-white/[0.08]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            accent ? "bg-[#c9a96e]/20 text-[#c9a96e]" : "bg-white/[0.06] text-white/40"
          }`}
        >
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-semibold ${accent ? "text-[#c9a96e]" : "text-white"}`}>
        {value}
      </p>
      {change !== undefined && (
        <p className="mt-2 text-xs flex items-center gap-1">
          {change >= 0 ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="text-emerald-400">+{change}%</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span className="text-red-400">{change}%</span>
            </>
          )}
          <span className="text-white/30 ml-1">за период</span>
        </p>
      )}
    </div>
  );
}
