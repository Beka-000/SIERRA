"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import { usePhoneInput } from "@/lib/usePhoneInput";
import SierraLogo from "@/app/components/SierraLogo";

// ─── Типы шагов ───────────────────────────────────────────────────────────────

type Step = "phone" | "otp" | "details";

// ─── Компонент OTP-ввода (6 отдельных ячеек) ─────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));
  const digits    = value.padEnd(6, "").split("").slice(0, 6);

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").replace(/\D/g, "").slice(0, 6));
  }

  function handleChange(index: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, d);
    if (d && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex gap-2.5 justify-between" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          aria-label={`Цифра ${i + 1}`}
          className="w-12 h-14 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white
                     text-xl font-semibold text-center outline-none transition caret-transparent
                     focus:border-[#c9a96e]/70 focus:bg-white/[0.1] focus:ring-2 focus:ring-[#c9a96e]/15
                     disabled:opacity-40"
        />
      ))}
    </div>
  );
}

// ─── Таймер повторной отправки ────────────────────────────────────────────────

function ResendTimer({
  onResend,
  disabled,
}: {
  onResend: () => Promise<void>;
  disabled: boolean;
}) {
  const [seconds,   setSeconds]   = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setSeconds(60);
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleResend() {
    if (seconds > 0 || resending || disabled) return;
    setResending(true);
    try {
      await onResend();
      setSeconds(60);
    } finally {
      setResending(false);
    }
  }

  if (seconds > 0) {
    return (
      <p className="text-sm text-white/30 text-center">
        Отправить повторно через{" "}
        <span className="text-white/50 tabular-nums">{seconds} с</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={resending || disabled}
      className="w-full text-sm text-[#c9a96e]/70 hover:text-[#c9a96e] transition
                 disabled:text-white/20 disabled:cursor-not-allowed"
    >
      {resending ? "Отправляем..." : "Отправить код повторно"}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
      <path d="M21 12a9 9 0 00-9-9"/>
    </svg>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { locale } = useLocale();
  const i18n = t(locale);

  // ── Шаг 1: телефон ────────────────────────────────────────────────────────
  const phone = usePhoneInput();

  // ── Шаг 2: OTP ────────────────────────────────────────────────────────────
  const [otp,         setOtp]         = useState("");
  const [otpSendKey,  setOtpSendKey]  = useState(0); // инкремент → сброс таймера
  const [verifiedPhone, setVerifiedPhone] = useState("");

  // ── Шаг 3: остальные данные ────────────────────────────────────────────────
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed,          setAgreed]          = useState(false);

  // ── Общее состояние ───────────────────────────────────────────────────────
  const [step,    setStep]    = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Шаг 1: отправить SMS ─────────────────────────────────────────────────

  async function sendOtp(): Promise<void> {
    setError("");
    if (!phone.validate()) {
      setError("Введите корректный номер телефона (+996 XXX XXX XXX)");
      throw new Error("invalid");
    }

    const res  = await fetch("/api/auth/otp/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone: phone.rawValue }),
    });
    const data = await res.json();

    if (!res.ok) {
      const msgs: Record<string, string> = {
        phone_exists:     "Этот номер уже зарегистрирован.",
        too_many_requests:"Слишком много попыток. Попробуйте через 10 минут.",
        invalid_phone:    "Введите корректный номер телефона.",
      };
      throw new Error(msgs[data.error] ?? data.message ?? "Ошибка отправки SMS.");
    }
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendOtp();
      setStep("otp");
      setOtpSendKey((k) => k + 1);
    } catch (err: any) {
      if (err.message !== "invalid") setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setOtp("");
    await sendOtp(); // при ошибке пробросит — ResendTimer покажет кнопку снова
    setOtpSendKey((k) => k + 1);
  }

  // ── Шаг 2: проверить OTP ─────────────────────────────────────────────────

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (otp.replace(/\D/g, "").length !== 6) {
      setError("Введите 6-значный код из SMS.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/otp/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msgs: Record<string, string> = {
          wrong_code:        data.message ?? "Неверный код.",
          otp_expired:       "Код истёк. Запросите новый.",
          too_many_attempts: "Слишком много попыток. Запросите новый код.",
        };
        setError(msgs[data.error] ?? data.message ?? "Ошибка проверки кода.");
        return;
      }

      setVerifiedPhone(data.phone);
      setStep("details");
    } finally {
      setLoading(false);
    }
  }

  // Автосабмит при вводе последней цифры
  useEffect(() => {
    if (otp.replace(/\D/g, "").length === 6 && step === "otp" && !loading) {
      const form = document.getElementById("otp-form") as HTMLFormElement | null;
      form?.requestSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // ── Шаг 3: завершить регистрацию ─────────────────────────────────────────

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Необходимо согласиться с условиями обработки данных");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError(i18n.register.errorPasswordMismatch);
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        phone:           verifiedPhone,
        email,
        password,
        confirmPassword,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || i18n.register.errorServer);
    } finally {
      setLoading(false);
    }
  }

  // ── Индикатор шагов ───────────────────────────────────────────────────────

  const STEPS: { id: Step; label: string }[] = [
    { id: "phone",   label: "Телефон" },
    { id: "otp",     label: "Код"     },
    { id: "details", label: "Данные"  },
  ];
  const stepIdx = STEPS.findIndex((s) => s.id === step);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0f0d0b]">
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <SierraLogo href="/" size="md" priority />
        </div>

        {/* Карточка */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">

          {/* Индикатор шагов */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                  i < stepIdx  ? "bg-[#c9a96e] text-[#0f0d0b]"     :
                  i === stepIdx? "bg-[#c9a96e]/20 border border-[#c9a96e]/60 text-[#c9a96e]" :
                                 "bg-white/[0.06] border border-white/[0.1] text-white/30"
                }`}>
                  {i < stepIdx ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (i + 1)}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-px mx-1 transition-colors ${
                    i < stepIdx ? "bg-[#c9a96e]/50" : "bg-white/[0.08]"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ══ ШАГ 1: Телефон ════════════════════════════════════════════════ */}
          {step === "phone" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  {i18n.register.title}
                </h1>
                <p className="text-sm text-white/40">
                  Введите номер телефона — мы отправим код подтверждения.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {i18n.register.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={phone.value}
                    onChange={phone.onChange}
                    onBlur={phone.onBlur}
                    placeholder="+996 555 123 456"
                    required
                    autoFocus
                    maxLength={17}
                    disabled={loading}
                    className={`w-full h-12 rounded-xl bg-white/[0.06] border text-white
                               placeholder-white/30 px-4 text-sm outline-none transition focus:bg-white/[0.08]
                               disabled:opacity-50 ${
                      phone.errorMsg
                        ? "border-red-500/50 focus:border-red-400"
                        : phone.isValid
                        ? "border-green-500/40 focus:border-green-400/60"
                        : "border-white/[0.1] focus:border-[#c9a96e]/40"
                    }`}
                  />
                  {phone.errorMsg && (
                    <p className="mt-1.5 text-xs text-red-400">{phone.errorMsg}</p>
                  )}
                  {phone.isValid && !phone.errorMsg && (
                    <p className="mt-1.5 text-xs text-green-400">✓ Номер корректен</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <><Spinner /> Отправляем...</> : "Получить код"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-white/40">
                {i18n.register.haveAccount}{" "}
                <Link href="/login" className="text-[#c9a96e] hover:text-[#d4b87a] transition">
                  {i18n.register.loginLink}
                </Link>
              </div>
            </>
          )}

          {/* ══ ШАГ 2: SMS OTP ════════════════════════════════════════════════ */}
          {step === "otp" && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition mb-4"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Изменить номер
                </button>

                <h1 className="text-2xl font-semibold text-white mb-2">
                  Подтвердите номер
                </h1>
                <p className="text-sm text-white/40 leading-relaxed">
                  Мы отправили 6-значный код на{" "}
                  <span className="text-white/70">{phone.value}</span>
                </p>
              </div>

              <form id="otp-form" onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">
                    Код из SMS
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(v) => { setOtp(v); setError(""); }}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.replace(/\D/g, "").length !== 6}
                  className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <><Spinner /> Проверяем...</> : "Подтвердить номер"}
                </button>

                <ResendTimer
                  key={otpSendKey}
                  onResend={handleResendOtp}
                  disabled={loading}
                />
              </form>
            </>
          )}

          {/* ══ ШАГ 3: Остальные данные ════════════════════════════════════════ */}
          {step === "details" && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full
                                  bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {verifiedPhone}
                  </div>
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">
                  {i18n.register.title}
                </h1>
                <p className="text-sm text-white/40">{i18n.register.subtitle}</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Имя */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {i18n.register.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={i18n.register.namePlaceholder}
                    required
                    autoFocus
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1]
                               text-white placeholder-white/30 px-4 text-sm outline-none transition
                               focus:border-[#c9a96e]/40 focus:bg-white/[0.08] disabled:opacity-50"
                  />
                </div>

                {/* Email (необязательно) */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {i18n.register.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={i18n.register.emailPlaceholder}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1]
                               text-white placeholder-white/30 px-4 text-sm outline-none transition
                               focus:border-[#c9a96e]/40 focus:bg-white/[0.08] disabled:opacity-50"
                  />
                </div>

                {/* Пароль */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {i18n.register.passwordLabel}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={i18n.register.passwordPlaceholder}
                    required
                    minLength={6}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1]
                               text-white placeholder-white/30 px-4 text-sm outline-none transition
                               focus:border-[#c9a96e]/40 focus:bg-white/[0.08] disabled:opacity-50"
                  />
                </div>

                {/* Подтверждение пароля */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {i18n.register.confirmLabel}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={i18n.register.confirmPlaceholder}
                    required
                    minLength={6}
                    disabled={loading}
                    className={`w-full h-12 rounded-xl bg-white/[0.06] border text-white
                               placeholder-white/30 px-4 text-sm outline-none transition
                               focus:bg-white/[0.08] disabled:opacity-50 ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-500/40 focus:border-red-400"
                        : "border-white/[0.1] focus:border-[#c9a96e]/40"
                    }`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1.5 text-xs text-red-400">Пароли не совпадают</p>
                  )}
                </div>

                {/* Согласие */}
                <label className="flex items-start gap-2 text-sm text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-white/[0.2] bg-white/[0.06]
                               text-[#c9a96e] focus:ring-[#c9a96e]/40"
                  />
                  <span>
                    {i18n.register.agreement}
                    <Link href="/privacy" className="text-[#c9a96e] hover:text-[#d4b87a] transition">
                      {i18n.register.terms}
                    </Link>
                  </span>
                </label>

                {/* Кнопка */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><Spinner /> {i18n.register.submitting}</>
                    : i18n.register.submitButton}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-white/40">
                {i18n.register.haveAccount}{" "}
                <Link href="/login" className="text-[#c9a96e] hover:text-[#d4b87a] transition">
                  {i18n.register.loginLink}
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
