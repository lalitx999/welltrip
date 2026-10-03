"use client";

/**
 * (portal)/portal/restaurant/page.tsx - menus + availability status.
 *
 * Phase-1 limitation (agreed, C12): backend has NO PATCH /foods/{id}/, so the
 * is_available toggle cannot be shipped yet - this page only reads the ACTIVE
 * list (public GET /foods/) and shows each menu's state. Inactive menus are
 * invisible to this API until the vendor-scoped endpoint arrives (Phase 2).
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, UtensilsCrossed, XCircle } from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/errors";
import { getMyFoods, updateFood } from "@/lib/api/vendor";
import { formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { FoodMenu } from "@/types/catalog";

export default function RestaurantPortalPage() {
  const { t, locale } = useI18n();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["portal-foods"],
    queryFn: () => getMyFoods<FoodMenu[] | { results: FoodMenu[] }>(),
  });

  const foodsData = data?.data;
  const rows: FoodMenu[] = Array.isArray(foodsData)
    ? foodsData
    : (foodsData as any)?.results ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      updateFood(id, { is_available: isAvailable }),
    onSuccess: () => {
      void refetch();
    },
  });

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <UtensilsCrossed className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("portal.restaurant")}
      </h1>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("portal.notOwnerNote")}
      </p>

      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("catalog.noResults")}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((menu) => (
            <li
              key={menu.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
            >
              <span
                className={
                  menu.is_available
                    ? "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
                    : "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
                }
              >
                {menu.is_available ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <XCircle className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {menu.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPriceText(menu.price, locale)}
                </p>
              </div>
              <Button
                variant={menu.is_available ? "outline" : "default"}
                size="sm"
                disabled={toggleMutation.isPending}
                onClick={() =>
                  toggleMutation.mutate({
                    id: menu.id,
                    isAvailable: !menu.is_available,
                  })
                }
              >
                {menu.is_available ? t("portal.available") : t("portal.unavailable")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
