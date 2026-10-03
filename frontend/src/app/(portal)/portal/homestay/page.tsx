"use client";

/**
 * (portal)/portal/homestay/page.tsx - set nightly room pricing / remaining
 * count (POST /accommodations/rooms/{id}/pricing/).
 *
 * Phase-1 API caveat: we list ACTIVE accommodations (public GET). Ownership is
 * enforced by the backend - editing someone else's room returns 403 and we
 * surface that message. Creating accommodations/rooms is not in Phase-1 portal
 * scope (backend has the endpoints but they were deferred - C12).
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, Hotel } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAccommodationRooms } from "@/lib/api/catalog";
import { getMyAccommodations, setRoomPricing } from "@/lib/api/vendor";
import { formatDateText, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Accommodation } from "@/types/catalog";

export default function HomestayPortalPage() {
  const { t, locale } = useI18n();
  const [accommodationId, setAccommodationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [priceOverride, setPriceOverride] = useState("");
  const [availableCount, setAvailableCount] = useState("");

  const accQuery = useQuery({
    queryKey: ["portal-accommodations"],
    queryFn: () => getMyAccommodations<Accommodation[] | { results: Accommodation[] }>(),
  });
  const accommodationsData = accQuery.data?.data;
  const accommodations: Accommodation[] = Array.isArray(accommodationsData)
    ? accommodationsData
    : (accommodationsData as any)?.results ?? [];

  const roomsQuery = useQuery({
    queryKey: ["portal-rooms", accommodationId],
    enabled: accommodationId.length > 0,
    queryFn: () => getAccommodationRooms(accommodationId),
  });
  const rooms = roomsQuery.data?.data.rooms ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      setRoomPricing(roomId, {
        date,
        ...(priceOverride.trim() !== ""
          ? { price_override: priceOverride.trim() }
          : {}),
        ...(availableCount.trim() !== ""
          ? { available_count: Number(availableCount) }
          : {}),
      }),
  });

  const bothEmpty = priceOverride.trim() === "" && availableCount.trim() === "";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (bothEmpty) {
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Hotel className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("portal.homestay")}
      </h1>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("portal.notOwnerNote")}
      </p>

      {accQuery.isLoading ? (
        <ListLoading />
      ) : accQuery.isError ? (
        <ListError
          message={extractErrorMessage(accQuery.error, t("common.networkError"))}
          onRetry={() => void accQuery.refetch()}
        />
      ) : accommodations.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("portal.noAccommodation")}
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="acc">{t("portal.chooseAccommodation")}</Label>
            <select
              id="acc"
              value={accommodationId}
              onChange={(e) => {
                setAccommodationId(e.target.value);
                setRoomId("");
              }}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {accommodations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} · {acc.province}
                </option>
              ))}
            </select>
          </div>
          {/* FORM_BODY */}
          {accommodationId &&
            (roomsQuery.isLoading ? (
              <ListLoading />
            ) : rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("portal.noRoom")}</p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="room">{t("portal.chooseRoom")}</Label>
                <select
                  id="room"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

          {roomId && (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("portal.roomPricingTitle")}
              </h2>
              <div className="space-y-1.5">
                <Label htmlFor="pdate">{t("portal.dateLabel")}</Label>
                <Input
                  id="pdate"
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pprice">{t("portal.priceOverride")}</Label>
                <Input
                  id="pprice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("portal.clearPriceHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pcount">{t("portal.availableCountLabel")}</Label>
                <Input
                  id="pcount"
                  type="number"
                  min={0}
                  value={availableCount}
                  onChange={(e) => setAvailableCount(e.target.value)}
                />
              </div>

              {bothEmpty && (
                <p className="text-xs text-destructive">
                  {t("common.errorOccurred")}
                </p>
              )}
              {mutation.isError && (
                <p className="text-xs text-destructive">
                  {extractErrorMessage(mutation.error, t("common.networkError"))}
                </p>
              )}
              {mutation.isSuccess && mutation.data && (
                <p className="text-xs text-emerald-700">
                  {t("portal.result", {
                    date: formatDateText(mutation.data.data.date, locale),
                    price: mutation.data.data.price_override ?? "—",
                    count: mutation.data.data.available_count,
                  })}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending || bothEmpty}
              >
                {mutation.isPending ? t("portal.saved") : t("portal.save")}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
