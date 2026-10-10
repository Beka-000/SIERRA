"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth";
import type { Translations } from "@/lib/i18n";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: number;
  customerName: string;
  customerPhone: string | null;
  totalAmount: string;
  status: string;
  createdAt: Date;
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  revenue: number;
  recent: OrderRow[];
}

interface Props {
  session: SessionPayload;
  stats: Stats;
  i18n: Translations;
}

// ─── Хелперы ──────────────────────────────────────────────────────────────────

function StatusBadge({ status, labels }: { status: string; labels: Translations["orderStatus"] }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:   { label: labels.pending,   color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    confirmed: { label: labels.confirmed, color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    cooking:   { label: labels.cooking,   color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
    ready:     { label: labels.ready,     color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    completed: { label: labels.completed, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    cancelled: { label: labels.cancelled, color: "bg-red-500/15 text-red-400 border-red-500/20" },
  };
  const item = map[status] ?? { label: status, color: "bg-white/10 text-white/50 border-white/10" };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.color}`}>
      {item.label}
    </span>
  );
}

function StatCard({ label, value, icon, accent = false }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-[#c9a96e]/10 border-[#c9a96e]/25" : "bg-white/[0.04] border-white/[0.08]"}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-[#c9a96e]/20" : "bg-white/[0.06]"}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-semibold ${accent ? "text-[#c9a96e]" : "text-white"}`}>{value}</p>
    </div>
  );
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function AdminDashboardClient({ session, stats, i18n }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
    }
  }

  const d = i18n.adminDashboard;

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-white">
      {/* Навигация */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M6 10h20v2a10 10 0 01-20 0v-2z" stroke="#c9a96e" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M10 10V7a6 6 0 0112 0v3" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-white">{i18n.brand}</span>
            <span className="text-white/20 mx-1">·</span>
            <span className="text-sm text-white/40">{d.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{session.name}</p>
              <p className="text-xs text-white/40">{session.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-40"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              {i18n.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Приветствие */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-white">
            {d.welcomeBack} <span className="text-[#c9a96e]">{session.name}</span>
          </h1>
          <p className="mt-1 text-sm text-white/40">{d.overview}</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label={d.totalOrders}
            value={stats.total}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            }
          />
          <StatCard
            label={d.pendingOrders}
            value={stats.pending}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            }
          />
          <StatCard
            label={d.completedOrders}
            value={stats.completed}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            }
          />
          <StatCard
            label={d.totalRevenue}
            value={`${stats.revenue.toLocaleString("ru-KZ")} ${d.currency}`}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            }
            accent
          />
        </div>

        {/* Таблица последних заказов */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <h2 className="font-medium text-white">{d.recentOrders}</h2>
          </div>

          {stats.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              <p className="text-sm">{d.noOrders}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[d.orderNumber, d.customer, d.amount, d.status, d.createdAt].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((order, idx) => (
                    <tr
                      key={order.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition ${idx === stats.recent.length - 1 ? "border-0" : ""}`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-[#c9a96e]">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{order.customerName}</p>
                        {order.customerPhone && (
                          <p className="text-xs text-white/40 mt-0.5">{order.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {parseFloat(order.totalAmount).toLocaleString("ru-KZ")} {d.currency}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} labels={i18n.orderStatus} />
                      </td>
                      <td className="px-6 py-4 text-sm text-white/40">
                        {new Date(order.createdAt).toLocaleDateString("ru-KZ", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
