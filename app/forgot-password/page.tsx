"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import SierraLogo from "@/app/components/SierraLogo";

type Step = "form" | "sent";

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState("");
  const [step,     setStep]     = useState<Step>("form");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Введите корректный Email.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.message ?? "Слишком много запросов. Попробуйте позже.");
        return;
      }
      if (!res.ok) {
        setError(data.message ?? "Ошибка сервера. Попробуйте позже.");
        return;
      }
      // Независимо от того, существует ли email — показываем одно сообщение
      setStep("sent");
    } catch {
      setError("Ошибка сети. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0f0d0b]">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <SierraLogo href="/" size="md" priority />
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">

          {step === "form" ? (
            <>
              {/* Заголовок */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  Восстановление пароля
                </h1>
                <p className="text-sm text-white/40 leading-relaxed">
                  Введите Email, указанный при регистрации. Мы отправим вам
                  ссылку для восстановления пароля.
                </p>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Форма */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    required
                    autoFocus
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1]
                               text-white placeholder-white/30 px-4 text-sm outline-none transition
                               focus:border-[#c9a96e]/40 focus:bg-white/[0.08]
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                        <path d="M21 12a9 9 0 00-9-9"/>
                      </svg>
                      Отправляем...
                    </span>
                  ) : "Отправить ссылку"}
                </button>
              </form>

              {/* Вернуться */}
              <div className="mt-6 text-center text-sm text-white/40">
                <Link
                  href="/login"
                  className="text-[#c9a96e] hover:text-[#d4b87a] transition inline-flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Вернуться ко входу
                </Link>
              </div>
            </>
          ) : (
            /* Успешная отправка */
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20
                                flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                       stroke="#c9a96e" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-semibold text-white mb-3 text-center">
                Проверьте Email
              </h1>

              <p className="text-sm text-white/50 leading-relaxed text-center mb-2">
                Если аккаунт с таким Email существует, мы отправили инструкцию
                по восстановлению пароля.
              </p>
              <p className="text-sm text-white/40 leading-relaxed text-center mb-8">
                Письмо может прийти в папку «Спам».
                Ссылка действительна <span className="text-white/60">1 час</span>.
              </p>

              <Link
                href="/login"
                className="btn-gold w-full h-12 justify-center flex items-center gap-2 text-sm font-semibold"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Вернуться ко входу
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
