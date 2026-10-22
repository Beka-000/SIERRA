"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SierraLogo from "@/app/components/SierraLogo";

// ─── Иконка видимости пароля ──────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ─── Требования к паролю ──────────────────────────────────────────────────────

function PasswordStrength({ value }: { value: string }) {
  const checks = [
    { label: "Минимум 6 символов", ok: value.length >= 6 },
    { label: "Буква",              ok: /[a-zA-Zа-яА-Я]/.test(value) },
    { label: "Цифра или символ",   ok: /[\d!@#$%^&*]/.test(value) },
  ];
  return (
    <div className="mt-2 space-y-1">
      {checks.map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
            ${ok ? "bg-[#c9a96e]/20 text-[#c9a96e]" : "bg-white/[0.06] text-white/20"}`}>
            {ok && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
          <span className={`text-xs ${ok ? "text-white/60" : "text-white/25"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Основное содержимое страницы ─────────────────────────────────────────────

type PageState = "checking" | "invalid" | "form" | "success";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [pageState,    setPageState]    = useState<PageState>("checking");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Проверяем токен при открытии страницы
  useEffect(() => {
    if (!token || token.length !== 64) {
      setPageState("invalid");
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setPageState(d.valid ? "form" : "invalid"))
      .catch(() => setPageState("invalid"));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Ошибка. Попробуйте запросить новую ссылку.");
        return;
      }
      setPageState("success");
      // Через 3 секунды перенаправляем на /login
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Ошибка сети. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  // ── Проверяем токен ──────────────────────────────────────────────────────
  if (pageState === "checking") {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <svg className="animate-spin text-[#c9a96e] w-8 h-8" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
          <path d="M21 12a9 9 0 00-9-9"/>
        </svg>
        <p className="text-sm text-white/40">Проверяем ссылку...</p>
      </div>
    );
  }

  // ── Токен недействителен ─────────────────────────────────────────────────
  if (pageState === "invalid") {
    return (
      <>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20
                          flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#ef4444" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3 text-center">
          Ссылка недействительна
        </h1>
        <p className="text-sm text-white/45 leading-relaxed text-center mb-8">
          Ссылка для восстановления пароля истекла или уже была использована.
          Запросите новую ссылку.
        </p>
        <Link
          href="/forgot-password"
          className="btn-gold w-full h-12 justify-center flex items-center text-sm font-semibold"
        >
          Запросить новую ссылку
        </Link>
        <div className="mt-4 text-center">
          <Link href="/login"
                className="text-sm text-white/40 hover:text-white/60 transition">
            Вернуться ко входу
          </Link>
        </div>
      </>
    );
  }

  // ── Успех ────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20
                          flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#4ade80" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3 text-center">
          Пароль изменён!
        </h1>
        <p className="text-sm text-white/45 leading-relaxed text-center mb-8">
          Ваш пароль успешно изменён.
          Перенаправляем на страницу входа...
        </p>
        <Link
          href="/login"
          className="btn-gold w-full h-12 justify-center flex items-center gap-2 text-sm font-semibold"
        >
          Войти
        </Link>
      </>
    );
  }

  // ── Форма нового пароля ──────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Новый пароль
        </h1>
        <p className="text-sm text-white/40">
          Придумайте надёжный пароль для вашего аккаунта.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Новый пароль */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Новый пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              autoFocus
              disabled={loading}
              className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1]
                         text-white placeholder-white/30 px-4 pr-12 text-sm outline-none transition
                         focus:border-[#c9a96e]/40 focus:bg-white/[0.08]
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {password && <PasswordStrength value={password} />}
        </div>

        {/* Подтверждение пароля */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Повторите пароль
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Повторите пароль"
              required
              disabled={loading}
              className={`w-full h-12 rounded-xl bg-white/[0.06] border text-white
                         placeholder-white/30 px-4 pr-12 text-sm outline-none transition
                         focus:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed
                         ${confirm && confirm !== password
                           ? "border-red-500/40 focus:border-red-500/60"
                           : confirm && confirm === password
                           ? "border-emerald-500/40 focus:border-emerald-500/60"
                           : "border-white/[0.1] focus:border-[#c9a96e]/40"}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              aria-label={showConfirm ? "Скрыть пароль" : "Показать пароль"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {confirm && confirm !== password && (
            <p className="mt-1.5 text-xs text-red-400">Пароли не совпадают</p>
          )}
          {confirm && confirm === password && (
            <p className="mt-1.5 text-xs text-emerald-400">✓ Пароли совпадают</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password.length < 6 || password !== confirm}
          className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                <path d="M21 12a9 9 0 00-9-9"/>
              </svg>
              Сохраняем...
            </span>
          ) : "Сохранить пароль"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login"
              className="text-sm text-white/40 hover:text-white/60 transition">
          Вернуться ко входу
        </Link>
      </div>
    </>
  );
}

// ─── Страница с Suspense для useSearchParams ──────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0f0d0b]">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <SierraLogo href="/" size="md" priority />
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <svg className="animate-spin text-[#c9a96e] w-8 h-8" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                <path d="M21 12a9 9 0 00-9-9"/>
              </svg>
            </div>
          }>
            <ResetPasswordContent />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
