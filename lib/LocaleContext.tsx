"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Locale, DEFAULT_LOCALE } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = "sierra_locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Всегда начинаем с DEFAULT_LOCALE — это гарантирует совпадение
  // серверного и первого клиентского рендера (гидратация без mismatch).
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // После монтирования читаем сохранённую локаль из localStorage.
  // Это происходит ТОЛЬКО на клиенте, после успешной гидратации.
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved && (["ru", "en", "ky"] as Locale[]).includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
