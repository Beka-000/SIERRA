"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminTopBarProps {
  userName: string;
  userEmail: string;
  onMenuToggle: () => void;
}

export default function AdminTopBar({ userName, userEmail, onMenuToggle }: AdminTopBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0f0d0b]/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Mobile menu button + Back to site */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/[0.06] transition text-white/60"
            aria-label="Открыть меню"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* ← На сайт */}
          <Link
            href="/"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08]
                       text-sm text-white/50 hover:text-white hover:border-white/[0.18]
                       hover:bg-white/[0.04] transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
            <span className="hidden sm:inline">На сайт</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="hidden md:block flex-1 max-w-md ml-6">
          <div className="relative">
            <input
              type="search"
              placeholder="Поиск..."
              className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/30 pl-10 pr-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.06]"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications */}
          <button
            className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/[0.06] transition text-white/50 hover:text-white"
            aria-label="Уведомления"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-3 h-10 px-3 rounded-xl hover:bg-white/[0.06] transition"
            >
              <div className="w-7 h-7 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white leading-none">{userName}</p>
                <p className="text-xs text-white/40 leading-none mt-1">{userEmail}</p>
              </div>
              <svg
                className="hidden md:block text-white/40"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#161411] border border-white/[0.08] shadow-xl z-20 py-2">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-white/40 mt-0.5">{userEmail}</p>
                  </div>

                  {/* Кнопка «Настройки» удалена */}

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-500/5 hover:text-red-400 transition disabled:opacity-40"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    {loggingOut ? "Выход..." : "Выйти"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
