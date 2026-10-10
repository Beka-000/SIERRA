"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";

const i18n = t("ru");

export default function AdminOtpPage() {
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Автофокус на первый инпут
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Таймер обратного отсчёта для повторной отправки
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Авто-сабмит когда все 6 цифр введены
    if (digit && index === 5) {
      const full = [...next].join("");
      if (full.length === 6) submitCode(full);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = [...code];
    pasted.split("").forEach((digit, i) => {
      if (i < 6) next[i] = digit;
    });
    setCode(next);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 6) submitCode(pasted);
  }

  async function submitCode(fullCode: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          invalid_code: i18n.adminOtp.errorInvalidCode,
          otp_expired:  i18n.adminOtp.errorExpired,
        };
        setError(messages[data.error] ?? i18n.adminOtp.errorServer);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError(i18n.adminOtp.errorServer);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    router.push("/admin/login");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const full = code.join("");
    if (full.length === 6) submitCode(full);
  }

  const isComplete = code.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center px-4">
      {/* Фоновый паттерн */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #c9a96e 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Иконка */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 mb-5">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {i18n.brand}
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            {i18n.adminOtp.subtitle}
          </p>
        </div>

        {/* Карточка */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-medium text-white mb-2">
            {i18n.adminOtp.title}
          </h2>
          <p className="text-sm text-white/40 mb-8 leading-relaxed">
            {i18n.adminOtp.description}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">
              {i18n.adminOtp.codeLabel}
            </label>

            {/* 6 отдельных инпутов */}
            <div className="flex gap-2.5 justify-between mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  aria-label={`Цифра ${index + 1}`}
                  className="w-12 h-14 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-xl font-semibold text-center outline-none transition focus:border-[#c9a96e]/70 focus:bg-white/[0.1] focus:ring-2 focus:ring-[#c9a96e]/15 disabled:opacity-40 caret-transparent"
                />
              ))}
            </div>

            {/* Ошибка */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-5">
                <svg className="mt-0.5 shrink-0 text-red-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Кнопка подтвердить */}
            <button
              type="submit"
              disabled={loading || !isComplete}
              className="w-full h-11 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold tracking-wide transition hover:bg-[#d4b87a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  {i18n.adminOtp.submitting}
                </>
              ) : (
                i18n.adminOtp.submitButton
              )}
            </button>
          </form>

          {/* Нижние действия */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="text-sm text-white/30 hover:text-white/60 transition"
            >
              ← {i18n.adminOtp.backToLogin}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-sm text-[#c9a96e]/70 hover:text-[#c9a96e] disabled:text-white/20 disabled:cursor-not-allowed transition"
            >
              {countdown > 0
                ? i18n.adminOtp.resendCountdown.replace("{seconds}", String(countdown))
                : i18n.adminOtp.resendButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
