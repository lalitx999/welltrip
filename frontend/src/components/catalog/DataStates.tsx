"use client";

/**
 * catalog/DataStates.tsx - shared loading / error placeholders for lists.
 *
 * WHY shared: every catalog page renders the same two transient states
 * (fetching, failed). TanStack Query leaves each page to decide its own
 * error text via extractErrorMessage(), then renders it through ListError.
 * Icons are lucide-only (zero-emoji) and both blocks keep the 44px touch
 * target on the retry button.
 */
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/** Centered spinner row for the initial data load. */
export function ListLoading() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{t("common.loading")}</span>
    </div>
  );
}

/** Inline error panel with an optional "try again" action. */
export function ListError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center"
    >
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <p className="max-w-xs text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="min-h-11"
        >
          {t("common.tryAgain")}
        </Button>
      )}
    </div>
  );
}
