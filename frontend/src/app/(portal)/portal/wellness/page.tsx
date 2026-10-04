"use client";

/**
 * (portal)/portal/wellness/page.tsx - create a manual time slot for a service
 * (POST /wellness/{id}/slots/) and view the slots already open on a date.
 *
 * The backend rejects overlapping/backwards slots and enforces ownership; we
 * surface its message instead of duplicating all rules client-side.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { CatalogImageEditor } from "@/components/travel/CatalogImageEditor";
import { Clock, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api/errors";
import { getWellnessSlots } from "@/lib/api/catalog";
import { createWellnessSlot, getMyWellness } from "@/lib/api/vendor";
import { formatClockTime, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { WellnessService } from "@/types/catalog";

export default function WellnessPortalPage() {
  const { t } = useI18n();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [capacity, setCapacity] = useState("");

  const serviceQuery = useQuery({
    queryKey: ["portal-services"],
    queryFn: () => getMyWellness<WellnessService[] | { results: WellnessService[] }>(),
  });
  const servicesData = serviceQuery.data?.data;
  const services: WellnessService[] = Array.isArray(servicesData)
    ? servicesData
    : (servicesData as any)?.results ?? [];

  const slotsQuery = useQuery({
    queryKey: ["portal-slots", serviceId, date],
    enabled: serviceId.length > 0,
    queryFn: () => getWellnessSlots(serviceId, date),
  });
  const slots = slotsQuery.data?.data.slots ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      createWellnessSlot(serviceId, {
        date,
        start_time: startTime,
        end_time: endTime,
        ...(capacity.trim() !== "" ? { capacity: Number(capacity) } : {}),
      }),
    onSuccess: () => {
      void slotsQuery.refetch();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("portal.wellness")}
      </h1>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("portal.notOwnerNote")}
      </p>

      {serviceQuery.isLoading ? (
        <ListLoading />
      ) : serviceQuery.isError ? (
        <ListError
          message={extractErrorMessage(serviceQuery.error, t("common.networkError"))}
          onRetry={() => void serviceQuery.refetch()}
        />
      ) : services.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("portal.noService")}
        </p>
      ) : (
        <>
          {/* FORM_BODY */}
          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="service">{t("portal.chooseService")}</Label>
              <select
                id="service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">—</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.title}
                  </option>
                ))}
              </select>
            </div>

            {serviceId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="slot-date">{t("portal.slotDate")}</Label>
                  <Input
                    id="slot-date"
                    type="date"
                    min={todayISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">{t("portal.capacityOptional")}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start">{t("portal.startTime")}</Label>
                  <Input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">{t("portal.endTime")}</Label>
                  <Input
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {mutation.isError && (
              <p className="text-xs text-destructive">
                {extractErrorMessage(mutation.error, t("common.networkError"))}
              </p>
            )}
            {mutation.isSuccess && (
              <p className="text-xs text-emerald-700">{t("portal.slotCreated")}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!serviceId || mutation.isPending}
            >
              {mutation.isPending ? t("portal.saved") : t("portal.createSlot")}
            </Button>
          </form>

          {services.filter(service=>service.id===serviceId).map(service=><CatalogImageEditor key={service.id} kind="wellness" id={service.id} image={service.image_url} title={service.title}/>)}
          {/* Existing slots on the chosen date */}
          {serviceId && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {t("portal.slotListTitle")}
              </h2>
              {slotsQuery.isLoading ? (
                <ListLoading />
              ) : slotsQuery.isError ? <ListError message={extractErrorMessage(slotsQuery.error)} onRetry={()=>void slotsQuery.refetch()}/> : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("portal.noSlotsForDate")}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {slots.map((slot) => (
                    <li
                      key={`${slot.slot_date}-${slot.start_time}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span>
                        {formatClockTime(slot.start_time)} –{" "}
                        {formatClockTime(slot.end_time)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("catalog.slotCapacity", {
                          left: slot.capacity_available,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
