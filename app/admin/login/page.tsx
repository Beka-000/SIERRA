"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";

const i18n = t("ru");

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          invalid_credentials: i18n.adminLogin.errorInvalidCredentials,
          account_blocked:     i18n.adminLogin.errorBlocked,
          no_access:           i18n.adminLogin.errorNoAccess,
        };
        setError(messages[data.error] ?? i18n.adminLogin.errorServer);
        return;
      }

      // Успех — переходим на страницу OTP
      router.push("/admin/otp");
    } catch {
      setError(i18n.adminLogin.errorServer);
    } finally {
      setLoading(false);
    }
  }

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
        {/* Логотип */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 mb-5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 10h20v2a10 10 0 01-20 0v-2zM10 10V7a6 6 0 0112 0v3"
                stroke="#c9a96e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 22v4M22 22v4M8 26h16"
                stroke="#c9a96e"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {i18n.brand}
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            {i18n.adminLogin.subtitle}
          </p>
        </div>

        {/* Карточка */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-medium text-white mb-6">
            {i18n.adminLogin.title}
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                {i18n.adminLogin.emailLabel}
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={i18n.adminLogin.emailPlaceholder}
                className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 px-4 text-sm outline-none transition focus:border-[#c9a96e]/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#c9a96e]/10"
              />
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                {i18n.adminLogin.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={i18n.adminLogin.passwordPlaceholder}
                  className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 px-4 pr-11 text-sm outline-none transition focus:border-[#c9a96e]/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#c9a96e]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <svg className="mt-0.5 shrink-0 text-red-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-sm font-semibold tracking-wide transition hover:bg-[#d4b87a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  {i18n.adminLogin.submitting}
                </>
              ) : (
                i18n.adminLogin.submitButton
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
