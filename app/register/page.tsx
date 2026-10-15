"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";
import { usePhoneInput } from "@/lib/usePhoneInput";
import SierraLogo from "@/app/components/SierraLogo";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { locale } = useLocale();
  const i18n = t(locale);

  const [name, setName] = useState("");
  const phone = usePhoneInput();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Валидация номера Кыргызстана: +996 + 9 цифр = +996XXXXXXXXX
  // Обработка телефона вынесена в хук usePhoneInput

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Необходимо согласиться с условиями обработки данных");
      return;
    }

    if (!phone.validate()) {
      setError("Введите корректный номер телефона (+996 XXX XXX XXX)");
      return;
    }

    if (password !== confirmPassword) {
      setError(i18n.register.errorPasswordMismatch);
      return;
    }

    setLoading(true);

    try {
      await register({ name, phone: phone.rawValue, email, password, confirmPassword });
      router.push("/");
    } catch (err: any) {
      setError(err.message || i18n.register.errorServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0f0d0b]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <SierraLogo href="/" size="md" priority />
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-2">{i18n.register.title}</h1>
            <p className="text-sm text-white/40">{i18n.register.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
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
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
            </div>

            {/* Phone */}
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
                maxLength={17}
                className={`w-full h-12 rounded-xl bg-white/[0.06] border text-white placeholder-white/30 px-4 text-sm outline-none transition focus:bg-white/[0.08] ${
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
              {phone.isValid && (
                <p className="mt-1.5 text-xs text-green-400">✓ Номер корректен</p>
              )}
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                {i18n.register.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={i18n.register.emailPlaceholder}
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
            </div>

            {/* Password */}
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
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
            </div>

            {/* Confirm Password */}
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
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2 text-sm text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/[0.2] bg-white/[0.06] text-[#c9a96e] focus:ring-[#c9a96e]/40"
              />
              <span>
                {i18n.register.agreement}
                <Link href="/privacy" className="text-[#c9a96e] hover:text-[#d4b87a] transition">
                  {i18n.register.terms}
                </Link>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? i18n.register.submitting : i18n.register.submitButton}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-white/40">
            {i18n.register.haveAccount}{" "}
            <Link href="/login" className="text-[#c9a96e] hover:text-[#d4b87a] transition">
              {i18n.register.loginLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
