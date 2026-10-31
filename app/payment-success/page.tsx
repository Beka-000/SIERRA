"use client";

/**
 * /payment-success
 *
 * Страница возврата после оплаты через Finik Pay.
 *
 * ВАЖНО: параметры URL (orderId, status из Finik) НИКОГДА не считаются
 * доказательством оплаты. Подлинный статус читается только из БД,
 * куда его записывает webhook от Finik на сервере.
 *
 * Сценарии:
 *  1. Webhook уже пришёл до редиректа → сразу показываем confirmed/failed.
 *  2. Webhook ещё не пришёл (типичный случай) → polling до MAX_ATTEMPTS раз,
 *     потом показываем «Проверяем оплату» с кнопкой обновить вручную.
 *  3. orderId отсутствует → показываем ошибку без попытки угадать статус.
 */

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

// Статусы, при которых polling прекращается
const TERMINAL_ORDER_STATUSES  = new Set(["CONFIRMED", "CANCELLED", "COMPLETED"]);
const TERMINAL_PAYMENT_STATUSES = new Set(["success", "failed", "cancelled"]);

const POLL_INTERVAL_MS = 3000;  // 3 секунды между запросами
const MAX_ATTEMPTS     = 15;    // итого ~45 секунд ожидания

// ─── Типы ────────────────────────────────────────────────────────────────────

type PollState =
  | "loading"       // первый запрос
  | "pending"       // webhook ещё не пришёл — ждём
  | "confirmed"     // оплата подтверждена webhook'ом
  | "failed"        // платёж не прошёл
  | "timeout"       // MAX_ATTEMPTS исчерпан, неизвестно
  | "error";        // ошибка сети или сервера

interface PaymentStatusResponse {
  orderId:     string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  createdAt:   string;
  payment: {
    id:     string;
    status: string;
    amount: number;
  } | null;
}

// ─── Основной компонент ──────────────────────────────────────────────────────

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { locale }   = useLocale();
  const i18n         = t(locale);

  // Единственное, что нам нужно из URL — orderId, чтобы запросить статус с сервера
  const orderId = searchParams.get("orderId");

  const [pollState, setPollState]   = useState<PollState>("loading");
  const [attempts,  setAttempts]    = useState(0);
  const [data,      setData]        = useState<PaymentStatusResponse | null>(null);
  const [netError,  setNetError]    = useState<string | null>(null);

  // ── Один запрос к /api/orders/[id]/payment-status ────────────────────────
  const fetchStatus = useCallback(async (): Promise<boolean> => {
    // Возвращает true, если polling можно остановить (терминальный статус)
    if (!orderId) {
      setPollState("error");
      return true;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`);

      if (!res.ok) {
        if (res.status === 404) {
          setNetError("Заказ не найден");
          setPollState("error");
          return true;
        }
        // Любая другая ошибка сервера — продолжаем polling
        return false;
      }

      const body: PaymentStatusResponse = await res.json();
      setData(body);
      setNetError(null);

      const payStatus   = body.payment?.status ?? "pending";
      const orderStatus = body.orderStatus;

      if (payStatus === "success" || TERMINAL_ORDER_STATUSES.has(orderStatus) && orderStatus === "CONFIRMED") {
        setPollState("confirmed");
        return true;
      }
      if (payStatus === "failed" || payStatus === "cancelled" || orderStatus === "CANCELLED") {
        setPollState("failed");
        return true;
      }

      setPollState("pending");
      return false;
    } catch {
      // Сетевая ошибка — не прерываем polling
      return false;
    }
  }, [orderId]);

  // ── Polling loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setPollState("error");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;

    async function poll() {
      if (cancelled) return;

      count += 1;
      setAttempts(count);

      const done = await fetchStatus();
      if (done || cancelled) return;

      if (count >= MAX_ATTEMPTS) {
        setPollState("timeout");
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, fetchStatus]);

  // ── Рендер ────────────────────────────────────────────────────────────────

  if (!orderId) {
    return (
      <PageWrapper>
        <ErrorIcon />
        <h1 className="text-2xl font-bold text-white mb-3">Неизвестный заказ</h1>
        <p className="text-white/50 mb-8 text-sm">
          Ссылка не содержит номер заказа. Если вы оплатили — заказ всё равно зафиксирован.
          Проверьте раздел «Мои заказы» в профиле.
        </p>
        <Link href="/profile" className="btn-gold inline-flex items-center gap-2">
          Мои заказы
        </Link>
      </PageWrapper>
    );
  }

  // ── Загрузка / ожидание webhook ───────────────────────────────────────────
  if (pollState === "loading" || pollState === "pending") {
    return (
      <PageWrapper>
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg
            className="animate-spin text-amber-400"
            width="36" height="36" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.2" />
            <path d="M21 12a9 9 0 00-9-9" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#c9a96e] mb-3">
          Проверяем оплату…
        </h1>
        <p className="text-white/60 mb-2 text-sm">
          Ждём подтверждения от платёжной системы.
        </p>
        <p className="text-white/30 text-xs mb-8">
          Не закрывайте страницу — это займёт несколько секунд.
        </p>

        {data && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 mb-6 text-left">
            <p className="text-xs text-white/40 mb-1">Заказ</p>
            <p className="text-sm font-semibold text-[#c9a96e]">#{data.orderNumber}</p>
            {data.totalAmount != null && (
              <p className="text-xs text-white/40 mt-1">
                {Number(data.totalAmount).toLocaleString("ru-KG")} с
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-white/20">
          Попытка {attempts} из {MAX_ATTEMPTS}
        </p>
      </PageWrapper>
    );
  }

  // ── Timeout — webhook не пришёл за 45 секунд ─────────────────────────────
  if (pollState === "timeout") {
    return (
      <PageWrapper>
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-amber-400 mb-3">
          Оплата обрабатывается
        </h1>
        <p className="text-white/60 mb-2 text-sm">
          Подтверждение ещё не получено. Это нормально — иногда занимает до 5 минут.
        </p>
        <p className="text-white/40 text-sm mb-8">
          Если вы оплатили — заказ будет подтверждён автоматически.
          Повторно платить <strong className="text-white/70">не нужно</strong>.
        </p>

        {data && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 mb-6 text-left">
            <p className="text-xs text-white/40 mb-1">Заказ</p>
            <p className="text-sm font-semibold text-[#c9a96e]">#{data.orderNumber}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setPollState("loading");
              setAttempts(0);
            }}
            className="btn-gold inline-flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
            Проверить ещё раз
          </button>
          <Link href="/profile" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.08] transition text-sm font-medium">
            Мои заказы
          </Link>
        </div>
      </PageWrapper>
    );
  }

  // ── Ошибка ────────────────────────────────────────────────────────────────
  if (pollState === "error") {
    return (
      <PageWrapper>
        <ErrorIcon />
        <h1 className="text-2xl font-bold text-white mb-3">Что-то пошло не так</h1>
        <p className="text-white/50 text-sm mb-8">
          {netError ?? "Не удалось получить статус заказа. Если вы оплатили — заказ зафиксирован."}
        </p>
        <Link href="/profile" className="btn-gold inline-flex items-center gap-2">
          Мои заказы
        </Link>
      </PageWrapper>
    );
  }

  // ── Платёж не прошёл ──────────────────────────────────────────────────────
  if (pollState === "failed") {
    return (
      <PageWrapper>
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-red-400 mb-3">Оплата не прошла</h1>
        <p className="text-white/60 text-sm mb-2">
          Платёж был отклонён или отменён. Заказ сохранён.
        </p>
        <p className="text-white/40 text-sm mb-8">
          Вы можете попробовать оплатить снова из раздела «Мои заказы»,
          или обратитесь в поддержку.
        </p>

        {data && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 mb-6 text-left">
            <p className="text-xs text-white/40 mb-1">Заказ</p>
            <p className="text-sm font-semibold text-white">#{data.orderNumber}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link
              href={`/order/${orderId}`}
              className="btn-gold inline-flex items-center justify-center gap-2"
            >
              Перейти к заказу
            </Link>
          )}
          <Link href="/" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.08] transition text-sm font-medium">
            На главную
          </Link>
        </div>
      </PageWrapper>
    );
  }

  // ── Оплата подтверждена ───────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-[#c9a96e] mb-3" style={{ fontFamily: "var(--font-display)" }}>
        {i18n.paymentSuccess.title}
      </h1>
      <p className="text-white/80 mb-2">{i18n.paymentSuccess.message}</p>

      {data && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 mb-6 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Заказ</span>
            <span className="text-sm font-semibold text-[#c9a96e]">#{data.orderNumber}</span>
          </div>
          {data.totalAmount != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Сумма</span>
              <span className="text-sm text-white">{Number(data.totalAmount).toLocaleString("ru-KG")} с</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">{i18n.paymentSuccess.paymentMethod}</span>
            <span className="text-sm text-white">Finik QR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">{i18n.paymentSuccess.status}</span>
            <span className="text-green-400 flex items-center gap-1.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {i18n.paymentSuccess.statusPaid}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderId && (
          <Link
            href={`/order/${orderId}`}
            className="btn-gold inline-flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            Отследить заказ
          </Link>
        )}
        <Link href="/" className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.08] transition text-sm font-medium gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {i18n.paymentSuccess.homeBtn}
        </Link>
      </div>

      <p className="mt-8 text-xs text-white/25">{i18n.paymentSuccess.thankYou}</p>
    </PageWrapper>
  );
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0f0d0b]">
      <div className="max-w-md w-full text-center">
        {children}
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/>
      </svg>
    </div>
  );
}

// ─── Экспорт со Suspense (useSearchParams требует Suspense-обёртки) ────────────

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f0d0b]">
          <div className="w-10 h-10 border-4 border-white/[0.1] border-t-[#c9a96e] rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
