"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * TH/EN language switcher. Uses the global I18nProvider (localStorage).
 * Buttons respect the 44px minimum touch target (spec §7.1).
 */
export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const option = (code: "th" | "en", label: string) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      aria-pressed={locale === code}
      className={cn(
        "h-11 min-w-12 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        locale === code
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-border bg-background p-0.5"
    >
      {option("th", "TH")}
      {option("en", "EN")}
    </div>
  );
}
