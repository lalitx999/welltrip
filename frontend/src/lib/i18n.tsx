"use client";

/**
 * lib/i18n.tsx - lightweight I18nProvider + useI18n() hook.
 *
 * Custom i18n (decision made with the project owner): a React context +
 * typed dictionaries instead of a full library. The chosen locale is
 * persisted in localStorage. Default = Thai.
 *
 * NOTE (future): if the app grows real multi-locale routing (e.g. /th, /en
 * URL prefixes, SEO hreflang), migrate to next-intl. All components read
 * strings ONLY through useI18n().t(...), so the swap stays localised.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  dictionaries,
  type Locale,
  type MessageKey,
} from "@/i18n/messages";

const STORAGE_KEY = "wt_locale";
const DEFAULT_LOCALE: Locale = "th";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "th" ? stored : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Applied in an effect (not useState initializer) to avoid a hydration
  // mismatch when the stored locale differs from the SSR default.
  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    setLocaleState(next);
  }, []);

  const t = useCallback<I18nContextValue["t"]>(
    (key, vars) => {
      const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
      let text = dict[key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an <I18nProvider>.");
  }
  return ctx;
}
