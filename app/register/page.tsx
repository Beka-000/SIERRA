"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { locale } = useLocale();
  const i18n = t(locale);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Необходимо согласиться с условиями обработки данных");
      return;
    }

    if (password !== confirmPassword) {
      setError(i18n.register.errorPasswordMismatch);
      return;
    }

    setLoading(true);

    try {
      await register({ name, phone, email, password, confirmPassword });
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
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center transition group-hover:bg-[#c9a96e]/20">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 12h20v2a10 10 0 01-20 0v-2z"
                stroke="#c9a96e" strokeWidth="1.5" strokeLinejoin="round"
              />
              <path
                d="M10 12V8a6 6 0 0112 0v4"
                stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"
              />
              <path
                d="M10 24v3M22 24v3M8 27h16"
                stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="text-2xl font-semibold tracking-tight text-[#f5f0e8]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sierra Coffee
          </span>
        </Link>

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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={i18n.register.phonePlaceholder}
                required
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
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
