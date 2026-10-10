"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const orderId = searchParams.get("orderId");
  const paymentStatus = searchParams.get("payment");

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

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0f0d0b]">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-bold text-[#c9a96e] mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Оплата успешна!
        </h1>

        {/* Message */}
        <p className="text-white/80 mb-2">
          Ваш платеж прошёл успешно
        </p>

        {orderId && (
          <p className="text-sm text-white/40 mb-8">
            Номер заказа: <span className="text-[#c9a96e]">{orderId}</span>
          </p>
        )}

        {/* Info Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60">Сумма платежа:</span>
            <span className="text-xl font-semibold text-white">5 сом</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60">Способ оплаты:</span>
            <span className="text-white">Finik QR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Статус:</span>
            <span className="text-green-400 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Оплачено
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-6">
          <p className="text-sm text-white/60">
            Перенаправление на главную через {countdown}...
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
            На главную
          </Link>

          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.08] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Мой профиль
          </Link>
        </div>

        {/* Thank You Message */}
        <p className="mt-8 text-sm text-white/30">
          Спасибо за ваш заказ в Sierra Coffee! ☕
        </p>
      </div>
    </div>
  );
}


export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0f0d0b]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/40">Загрузка...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
