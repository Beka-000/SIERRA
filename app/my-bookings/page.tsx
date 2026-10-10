"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {i18n.back}
          </Link>
          <h1 className="text-3xl font-semibold text-white">Мои бронирования</h1>
        </div>

        {/* Empty State */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-white mb-2">У вас пока нет бронирований</h2>
          <p className="text-white/40 mb-6">Забронируйте столик в Sierra Coffee прямо сейчас</p>
          <Link href="/#booking" className="btn-gold inline-flex">
            Забронировать столик
          </Link>
        </div>
      </div>
    </div>
  );
}
