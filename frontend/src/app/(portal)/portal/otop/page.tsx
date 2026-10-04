"use client";

/**
 * (portal)/portal/otop/page.tsx - adjust product stock by a signed delta
 * (POST /otop/{id}/stock/). The backend rejects a result below zero and
 * delta=0; we still validate client-side first (UX) but trust the server.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { CatalogImageEditor } from "@/components/travel/CatalogImageEditor";
import { Package } from "lucide-react";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/errors";
import { adjustOtopStock, getMyOtopProducts, updateOtopProduct } from "@/lib/api/vendor";
import { useI18n } from "@/lib/i18n";
import type { OTOPProduct } from "@/types/catalog";

export default function OtopPortalPage() {
  const { t } = useI18n();
  const [delta, setDelta] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["portal-otop"],
    queryFn: () => getMyOtopProducts<OTOPProduct[] | { results: OTOPProduct[] }>(),
  });
  const otopData = data?.data;
  const rows: OTOPProduct[] = Array.isArray(otopData)
    ? otopData
    : (otopData as any)?.results ?? [];

  const adjust = useMutation({
    mutationFn: ({ productId, value }: { productId: string; value: number }) =>
      adjustOtopStock(productId, { delta: value }),
    onSuccess: () => {
      void refetch();
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      updateOtopProduct(productId, { is_active: isActive }),
    onSuccess: () => {
      void refetch();
    },
  });

  function onAdjust(productId: string) {
    const value = Number(delta[productId] ?? "");
    if (!Number.isInteger(value) || value === 0) {
      return;
    }
    adjust.mutate({ productId, value });
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Package className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("portal.otop")}
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
          {rows.map((product) => {
            const failed =
              adjust.isError && adjust.variables?.productId === product.id;
            return (
              <li
                key={product.id}
                className="rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("portal.currentStock")}: {product.stock_quantity} · {product.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        product.stock_quantity <= 0 || !product.is_active
                          ? "shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                          : "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                      }
                    >
                      {!product.is_active
                        ? t("portal.unavailable")
                        : product.stock_quantity <= 0
                        ? t("catalog.outOfStock")
                        : t("portal.available")}
                    </span>
                    <Button
                      variant={product.is_active ? "outline" : "default"}
                      size="sm"
                      disabled={toggleActive.isPending}
                      onClick={() =>
                        toggleActive.mutate({
                          productId: product.id,
                          isActive: !product.is_active,
                        })
                      }
                    >
                      {product.is_active ? t("portal.available") : t("portal.unavailable")}
                    </Button>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <Input
                    aria-label={`${t("portal.deltaHint")} ${product.name}`}
                    type="number"
                    placeholder={t("portal.deltaHint")}
                    value={delta[product.id] ?? ""}
                    onChange={(e) =>
                      setDelta((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={adjust.isPending}
                    onClick={() => onAdjust(product.id)}
                  >
                    {t("portal.applyDelta")}
                  </Button>
                </div>
                <CatalogImageEditor kind="otop" id={product.id} image={product.image_url} title={product.name}/>
                {toggleActive.isError && toggleActive.variables?.productId === product.id && <p role="alert" className="wt-error">{extractErrorMessage(toggleActive.error)}</p>}
                {failed && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {extractErrorMessage(adjust.error, t("common.networkError"))}
                  </p>
                )}
                {adjust.isSuccess && adjust.variables?.productId === product.id && (
                  <p className="mt-1.5 text-xs text-emerald-700">
                    {t("portal.stockUpdated")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
