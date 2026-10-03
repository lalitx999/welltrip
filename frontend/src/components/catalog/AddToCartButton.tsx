"use client";

/**
 * catalog/AddToCartButton.tsx - the standard "add to cart" button.
 *
 * WHY a component and not inline buttons: every catalog surface needs the
 * same three states - idle (add), just-added feedback (check), disabled with
 * a reason (sold out / no dates). Centralising it keeps the click feedback
 * consistent and avoids each page owning a timeout ref.
 *
 * The button does NOT know about the cart: it calls `onAdd()` (the page builds
 * the CartItem with the right entity_id/dates) so this component stays dumb
 * and reusable.
 */
import { Check, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const FEEDBACK_MS = 1400;

export function AddToCartButton({
  onAdd,
  disabled = false,
  disabledLabel,
  className,
  iconOnly = false,
}: {
  onAdd: () => void;
  /** Disable clicking (e.g. sold out, missing required dates). */
  disabled?: boolean;
  /** Shown when disabled so users know WHY (e.g. "Sold out"). */
  disabledLabel?: string;
  className?: string;
  /** Compact icon+label row for dense list cards. */
  iconOnly?: boolean;
}) {
  const { t } = useI18n();
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleClick() {
    onAdd();
    setJustAdded(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setJustAdded(false), FEEDBACK_MS);
  }

  const effectiveDisabled = disabled || justAdded;

  const label = disabled
    ? disabledLabel ?? t("catalog.addToCart")
    : justAdded
      ? t("catalog.added")
      : t("catalog.addToCart");

  return (
    <Button
      type="button"
      variant={disabled ? "secondary" : "default"}
      size={iconOnly ? "sm" : "default"}
      className={cn("gap-1.5", className)}
      disabled={effectiveDisabled}
      onClick={handleClick}
      aria-disabled={effectiveDisabled}
      aria-label={iconOnly ? label : undefined}
    >
      {justAdded ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}
