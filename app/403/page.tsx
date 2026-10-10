"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

function ForbiddenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { locale } = useLocale();
  const i18n = t(locale);

  const [countdown, setCountdown] = useState(5);
  const from = searchParams.get("from");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const getMessage = () => {
    if (from === "admin") {
      return locale === "ru"
        ? "У вас нет прав доступа к административной панели"
        : locale === "ky"
        ? "Сизде администрациялык панелге кирүү укугу жок"
        : "You don't have access to the admin panel";
    }
    return locale === "ru"
      ? "У вас нет прав доступа к этой странице"
      : locale === "ky"
      ? "Сизде бул баракчага кирүү укугу жок"
      : "You don't have access to this page";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0f0d0b]">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        {/* Error Code */}
        <h1
          className="text-6xl font-bold text-[#c9a96e] mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          403
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-3">
          {locale === "ru"
            ? "Доступ запрещён"
            : locale === "ky"
            ? "Кирүүгө тыюу салынган"
            : "Access Forbidden"}
        </h2>

        {/* Message */}
        <p className="text-white/60 mb-2">{getMessage()}</p>

        {user && (
          <p className="text-sm text-white/40 mb-8">
            {locale === "ru"
              ? `Вы вошли как: ${user.name} (${user.role})`
              : locale === "ky"
              ? `Сиз кирдиңиз: ${user.name} (${user.role})`
              : `Logged in as: ${user.name} (${user.role})`}
          </p>
        )}

        {/* Countdown */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-6">
          <p className="text-sm text-white/60">
            {locale === "ru"
              ? `Перенаправление на главную через ${countdown}...`
              : locale === "ky"
              ? `Башкы баракчага ${countdown} секундтан кийин багыттоо...`
              : `Redirecting to home in ${countdown}...`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-gold inline-flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {locale === "ru" ? "На главную" : locale === "ky" ? "Башкы баракка" : "Go Home"}
          </Link>

          {user ? (
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.08] transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {locale === "ru" ? "Мой профиль" : locale === "ky" ? "Менин профилим" : "My Profile"}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.08] transition"
            >
              {i18n.nav.login}
            </Link>
          )}
        </div>

        {/* Help Text */}
        {from === "admin" && (
          <p className="mt-8 text-xs text-white/30">
            {locale === "ru"
              ? "Если вы считаете, что это ошибка, обратитесь к администратору"
              : locale === "ky"
              ? "Эгер бул катачылык деп эсептесеңиз, администраторго кайрылыңыз"
              : "If you believe this is an error, contact the administrator"}
          </p>
        )}
      </div>
    </div>
  );
}


export default function ForbiddenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0f0d0b]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/40">Загрузка...</p>
        </div>
      </div>
    }>
      <ForbiddenContent />
    </Suspense>
  );
}
