"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: {
              credential: string;
            }) => void;
          }) => void;

          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?:
                | "signin_with"
                | "signup_with"
                | "continue_with"
                | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              logo_alignment?: "left" | "center";
            }
          ) => void;

          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAuth();
  const { locale } = useLocale();

  const i18n = t(locale);

  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ------------------------------------------------
  // Google Login
  // ------------------------------------------------

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured"
      );

      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      // Google Identity Services initialize
      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          try {
            setError("");
            setGoogleLoading(true);

            if (!response.credential) {
              throw new Error(
                "Google credential алынган жок"
              );
            }

            // Backend'ке credential жөнөтөбүз
            const res = await fetch("/api/auth/google", {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                credential: response.credential,
              }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
              throw new Error(
                data.error ||
                  "Google менен кирүү ишке ашкан жок"
              );
            }

            // Session cookie backend тарабынан коюлду.
            // Башкы бетке өткөрөбүз.
            window.location.href = "/";
          } catch (err: any) {
            console.error(
              "Google login error:",
              err
            );

            setError(
              err?.message ||
                "Google менен кирүүдө ката кетти"
            );
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      // Google'дун даяр кнопкасын чыгарабыз
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 360,
          logo_alignment: "left",
        }
      );
    };

    // Google script буга чейин барбы?
    const existingScript =
      document.getElementById(
        "google-identity-services"
      );


if (existingScript) {
      initializeGoogle();
      return;
    }

    // Google Identity Services script
    const script = document.createElement("script");

    script.id = "google-identity-services";
    script.src =
      "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = initializeGoogle;

    document.head.appendChild(script);

    return () => {
      // Script'ти өчүрбөйбүз,
      // башка render болгондо кайра колдонулат.
    };
  }, []);

  // ------------------------------------------------
  // Email / Password Login
  // ------------------------------------------------

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);

      router.push("/");
    } catch (err: any) {
      setError(
        err?.message ||
          i18n.login?.errorServer ||
          "Кирүүдө ката кетти"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0f0d0b]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-8 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/25 flex items-center justify-center transition group-hover:bg-[#c9a96e]/20">
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M6 12h20v2a10 10 0 01-20 0v-2z"
                stroke="#c9a96e"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              <path
                d="M10 12V8a6 6 0 0112 0v4"
                stroke="#c9a96e"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              <path
                d="M10 24v3M22 24v3M8 27h16"
                stroke="#c9a96e"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span
            className="text-2xl font-semibold tracking-tight text-[#f5f0e8]"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            Sierra Coffee
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-2">
              Вход
            </h1>

            <p className="text-sm text-white/40">
              Войдите в личный кабинет
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Google Login */}
          <div className="mb-6">

            <div
              ref={googleButtonRef}
              className="flex justify-center min-h-[44px]"
            />

            {googleLoading && (
              <p className="text-center text-xs text-white/40 mt-3">
                Google аккаунт текшерилүүдө...
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-white/[0.08]" />

            <span className="text-xs text-white/30">
              или
            </span>

            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Email / Password */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >


{/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email или телефон
              </label>

              <input
                type="text"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="example@mail.com"
                required
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Введите пароль"
                required
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 px-4 text-sm outline-none transition focus:border-[#c9a96e]/40 focus:bg-white/[0.08]"
              />
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.06] text-[#c9a96e] focus:ring-[#c9a96e]/40"
                />

                <span>
                  Запомнить меня
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-[#c9a96e] hover:text-[#d4b87a] transition"
              >
                Забыли пароль?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full h-12 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Вход..."
                : "Войти"}
            </button>
          </form>

          {/* Register */}
          <div className="mt-6 text-center text-sm text-white/40">
            Нет аккаунта?{" "}

            <Link
              href="/register"
              className="text-[#c9a96e] hover:text-[#d4b87a] transition"
            >
              Зарегистрируйтесь
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}