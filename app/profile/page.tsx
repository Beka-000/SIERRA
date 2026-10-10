"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { locale } = useLocale();
  const i18n = t(locale);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40">{i18n.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] pt-24 px-6 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {i18n.back}
          </Link>
          <h1 className="text-3xl font-semibold text-white">Мой профиль</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-6 mb-8">
            {(user as any).avatar ? (
              <img
                src={(user as any).avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full border-2 border-[#c9a96e]/30 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#c9a96e]/20 border-2 border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] text-3xl font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">{user.name}</h2>
              <p className="text-white/40">{user.email || user.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/40 mb-2">Имя</label>
              <p className="text-white">{user.name}</p>
            </div>
            {user.email && (
              <div>
                <label className="block text-sm text-white/40 mb-2">Email</label>
                <p className="text-white">{user.email}</p>
              </div>
            )}
            {user.phone && (
              <div>
                <label className="block text-sm text-white/40 mb-2">Телефон</label>
                <p className="text-white">{user.phone}</p>
              </div>
            )}
            <div>
              <label className="block text-sm text-white/40 mb-2">Роль</label>
              <div className="flex items-center gap-2">
                <p className="text-white capitalize">{user.role}</p>
                {["admin", "manager", "staff"].includes(user.role) && (
                  <span className="px-2 py-0.5 rounded-md bg-[#c9a96e]/20 text-[#c9a96e] text-xs font-medium">
                    Сотрудник
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {["admin", "manager", "staff"].includes(user.role) && (
            <Link
              href="/admin/dashboard"
              className="bg-gradient-to-br from-[#c9a96e]/10 to-[#c9a96e]/5 border border-[#c9a96e]/20 rounded-2xl p-6 hover:from-[#c9a96e]/15 hover:to-[#c9a96e]/10 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Административная панель</h3>
                  <p className="text-sm text-white/40">Управление кофейней</p>
                </div>
              </div>
            </Link>
          )}

          <Link
            href="/my-bookings"
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Мои бронирования</h3>
                <p className="text-sm text-white/40">История и активные брони</p>
              </div>
            </div>
          </Link>

          <Link
            href="/#menu"
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
                  <path d="M6 12h20v2a10 10 0 01-20 0v-2z" strokeLinejoin="round"/>
                  <path d="M10 12V8a6 6 0 0112 0v4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Меню</h3>
                <p className="text-sm text-white/40">Посмотреть меню и заказать</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          {i18n.logout}
        </button>
      </div>
    </div>
  );
}
