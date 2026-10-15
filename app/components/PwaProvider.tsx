"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { t } from "@/lib/i18n";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── Переводы для UI ──────────────────────────────────────────────────────────

type PwaUi = {
  installTitle: string;
  installDesc: string;
  installBtn: string;
  dismissBtn: string;
  iosTitle: string;
  iosSteps: string;
  iosClose: string;
  updated: string;
  reload: string;
};

const UI: Record<string, PwaUi> = {
  ru: {
    installTitle: "Установить Sierra Coffee",
    installDesc:  "Добавьте приложение на главный экран для быстрого доступа",
    installBtn:   "Установить",
    dismissBtn:   "Не сейчас",
    iosTitle:     "Добавьте на экран",
    iosSteps:     "Нажмите «Поделиться» → «На экран «Домой»»",
    iosClose:     "Понятно",
    updated:      "Приложение обновлено. Перезагрузите страницу.",
    reload:       "Обновить",
  },
  en: {
    installTitle: "Install Sierra Coffee",
    installDesc:  "Add the app to your home screen for quick access",
    installBtn:   "Install",
    dismissBtn:   "Not now",
    iosTitle:     "Add to Home Screen",
    iosSteps:     "Tap «Share» → «Add to Home Screen»",
    iosClose:     "Got it",
    updated:      "App updated. Reload to apply changes.",
    reload:       "Reload",
  },
  ky: {
    installTitle: "Sierra Coffee орнотуу",
    installDesc:  "Тез жетүү үчүн колдонмону башкы экранга кошуңуз",
    installBtn:   "Орнотуу",
    dismissBtn:   "Азыр эмес",
    iosTitle:     "Экранга кошуу",
    iosSteps:     "«Бөлүшүү» → «Башкы экранга кошуу» басыңыз",
    iosClose:     "Түшүндүм",
    updated:      "Колдонмо жаңыртылды. Бетти жаңыртыңыз.",
    reload:       "Жаңыртуу",
  },
};

// ─── Определение iOS ──────────────────────────────────────────────────────────

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

// ─── Баннер установки (Android / Desktop) ────────────────────────────────────

function InstallBanner({
  onInstall,
  onDismiss,
  ui,
}: {
  onInstall: () => void;
  onDismiss: () => void;
  ui: PwaUi;
}) {
  return (
    <div
      role="dialog"
      aria-label={ui.installTitle}
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[997]
        bg-[#211A15] border border-[#c9a96e]/20 rounded-2xl p-4 shadow-2xl
        animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="Sierra Coffee" className="w-9 h-9 object-contain" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#f5f0e8] mb-0.5">{ui.installTitle}</p>
          <p className="text-xs text-[rgba(245,240,232,0.5)] leading-relaxed">{ui.installDesc}</p>
        </div>

        {/* Закрыть */}
        <button
          onClick={onDismiss}
          aria-label={ui.dismissBtn}
          className="flex-shrink-0 w-7 h-7 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] flex items-center justify-center transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onDismiss}
          className="flex-1 h-9 rounded-xl border border-white/[0.1] text-xs text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition"
        >
          {ui.dismissBtn}
        </button>
        <button
          onClick={onInstall}
          className="flex-1 h-9 rounded-xl bg-[#c9a96e] text-[#0f0d0b] text-xs font-semibold hover:bg-[#d4b87a] transition active:scale-95"
        >
          {ui.installBtn}
        </button>
      </div>
    </div>
  );
}

// ─── Подсказка для iOS ────────────────────────────────────────────────────────

function IosHint({
  onClose,
  ui,
}: {
  onClose: () => void;
  ui: PwaUi;
}) {
  return (
    <div
      role="dialog"
      aria-label={ui.iosTitle}
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[997]
        bg-[#211A15] border border-[#c9a96e]/20 rounded-2xl p-4 shadow-2xl
        animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[#f5f0e8]">{ui.iosTitle}</p>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-white/30 hover:text-white/60 flex items-center justify-center transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2.5 py-2 px-3 bg-white/[0.04] rounded-xl mb-3">
        {/* Share icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.8">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <p className="text-xs text-[rgba(245,240,232,0.6)] leading-relaxed">{ui.iosSteps}</p>
      </div>

      <button
        onClick={onClose}
        className="w-full h-9 rounded-xl bg-[#c9a96e]/15 text-[#c9a96e] text-xs font-semibold hover:bg-[#c9a96e]/25 transition"
      >
        {ui.iosClose}
      </button>

      {/* Стрелка вниз указывает на панель Safari */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#c9a96e]/20 border-b border-r border-[#c9a96e]/20 rotate-45" />
    </div>
  );
}

// ─── Баннер обновления ────────────────────────────────────────────────────────

function UpdateBanner({ ui }: { ui: PwaUi }) {
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[997]
      bg-[#211A15] border border-[#c9a96e]/25 rounded-2xl px-4 py-3 shadow-2xl
      flex items-center gap-3 animate-in slide-in-from-top-4 duration-300"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2">
        <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
      <p className="flex-1 text-xs text-[rgba(245,240,232,0.7)]">{ui.updated}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs font-semibold text-[#c9a96e] hover:text-[#d4b87a] transition"
      >
        {ui.reload}
      </button>
    </div>
  );
}

// ─── Главный провайдер ────────────────────────────────────────────────────────

export default function PwaProvider() {
  const { locale } = useLocale();
  const ui = UI[locale] ?? UI.ru;

  const [deferredPrompt,  setDeferredPrompt]  = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall,     setShowInstall]     = useState(false);
  const [showIosHint,     setShowIosHint]     = useState(false);
  const [showUpdate,      setShowUpdate]      = useState(false);
  const [swRegistered,    setSwRegistered]    = useState(false);

  // ── Регистрация Service Worker ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (swRegistered) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setSwRegistered(true);
        console.log("[PWA] Service Worker registered:", reg.scope);

        // Отслеживаем обновления SW
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      })
      .catch((err) => console.warn("[PWA] SW registration failed:", err));
  }, [swRegistered]);

  // ── Перехватываем beforeinstallprompt (Android / Desktop) ─────────────────
  useEffect(() => {
    if (isInStandaloneMode()) return; // уже установлено

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Показываем баннер через 30 сек, чтобы не раздражать сразу
      setTimeout(() => setShowInstall(true), 30_000);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // ── Подсказка для iOS Safari ───────────────────────────────────────────────
  useEffect(() => {
    if (!isIos() || isInStandaloneMode()) return;

    const key = "sierra_ios_hint_shown";
    if (sessionStorage.getItem(key)) return;

    const timer = setTimeout(() => {
      setShowIosHint(true);
      sessionStorage.setItem(key, "1");
    }, 45_000); // через 45 сек

    return () => clearTimeout(timer);
  }, []);

  // ── Обработчики ───────────────────────────────────────────────────────────

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setShowInstall(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] Install outcome:", outcome);
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstall(false);
    // Не показываем снова в этой сессии
    sessionStorage.setItem("sierra_install_dismissed", "1");
  };

  const handleDismissIos = () => setShowIosHint(false);

  return (
    <>
      {showUpdate  && <UpdateBanner ui={ui} />}
      {showInstall && deferredPrompt && (
        <InstallBanner onInstall={handleInstall} onDismiss={handleDismissInstall} ui={ui} />
      )}
      {showIosHint && <IosHint onClose={handleDismissIos} ui={ui} />}
    </>
  );
}
