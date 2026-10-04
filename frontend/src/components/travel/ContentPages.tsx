"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import { getContent, getContentDetail, type ContentKind } from "@/lib/api/experience";
import { useI18n } from "@/lib/i18n";
import { useTravelCopy } from "./travel-shell";
import { Media, PageHeading, Pagination } from "./Primitives";
import { ListLoading } from "@/components/catalog/DataStates";
import { formatDateText } from "@/lib/format";
import { FALLBACK_EDITORIAL_ENTRIES } from "@/lib/sisaket-tourism-data";

export function ContentList({ kind }: { kind: ContentKind }) {
  const copy = useTravelCopy();
  const { locale } = useI18n();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["editorial", kind, page],
    queryFn: () => getContent(kind, page),
  });

  const fallbackItems = FALLBACK_EDITORIAL_ENTRIES.filter((e) => e.kind === kind);
  const items = q.data?.data && q.data.data.length > 0 ? q.data.data : fallbackItems;

  return (
    <div className="wt-page space-y-6">
      <PageHeading
        eyebrow={
          kind === "STORY"
            ? "STORIES & EVENTS"
            : kind === "COMMUNITY"
            ? "MEET THE COMMUNITY"
            : "TRIP INSPIRATION"
        }
        title={
          kind === "STORY"
            ? copy("เรื่องราวและกิจกรรมระหว่างทาง", "Stories & Events along the way")
            : kind === "COMMUNITY"
            ? copy("ผู้คนที่ทำให้ทริปมีความหมาย", "The people behind the journey")
            : copy("หาแรงบันดาลใจให้ทริปใหม่", "Find your next inspiration")
        }
        description={copy(
          "เรื่องราว ข่าวสาร และปฏิทินกิจกรรมประจำปีที่เผยแพร่โดยชุมชนศรีสะเกษ",
          "Stories, events calendar, and news published by Sisaket community"
        )}
      />

      {kind === "ATTRACTION" && (
        <div className="wt-panel wt-actions">
          <span>
            {copy(
              "อยากได้คำแนะนำจากเป้าหมายสุขภาพของคุณ?",
              "Want suggestions based on your wellness goals?"
            )}
          </span>
          <Link href="/health" className="wt-button">
            {copy("เริ่มประเมิน", "Start assessment")}
          </Link>
        </div>
      )}

      {q.isLoading && !fallbackItems.length ? (
        <ListLoading />
      ) : (
        <div className="wt-grid">
          {items.map((item) => {
            const title = locale === "en" ? item.title_en || item.title : item.title;
            const summary = locale === "en" ? item.summary_en || item.summary : item.summary;
            return (
              <article className="wt-card" key={item.id}>
                <Link href={`/stories/${item.id}`} aria-label={title}>
                  <Media src={item.image_url} alt={item.image_alt || title} />
                </Link>
                {item.starts_at && (
                  <span className="wt-card-meta">
                    <Calendar size={14} />
                    {formatDateText(item.starts_at, locale)}
                  </span>
                )}
                <h2 className="font-serif text-lg font-semibold text-[#193e30]">{title}</h2>
                {item.location && (
                  <p className="wt-card-meta">
                    <MapPin size={14} />
                    {item.location}
                  </p>
                )}
                <p className="text-sm text-[#5c7064] line-clamp-3 leading-relaxed">{summary}</p>
                <Link className="wt-button secondary mt-2" href={`/stories/${item.id}`}>
                  {copy("อ่านเรื่องราว", "Read more")}
                  <ArrowUpRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        total={q.data?.meta?.pagination?.total_pages ?? 1}
        busy={q.isFetching}
        onChange={setPage}
      />
    </div>
  );
}

export function ContentDetail({ id }: { id: string }) {
  const copy = useTravelCopy();
  const { locale } = useI18n();
  const q = useQuery({
    queryKey: ["editorial-detail", id],
    queryFn: () => getContentDetail(id),
  });

  const fallback = FALLBACK_EDITORIAL_ENTRIES.find((e) => e.id === id);
  const item = q.data?.data || fallback;

  if (q.isLoading && !fallback) return <ListLoading />;
  if (!item) return null;

  const title = locale === "en" ? item.title_en || item.title : item.title;
  const summary = locale === "en" ? item.summary_en || item.summary : item.summary;
  const body = locale === "en" ? item.body_en || item.body : item.body;

  return (
    <article className="wt-page space-y-6" style={{ maxWidth: 800 }}>
      <Link
        className="wt-button secondary"
        href={item.kind === "STORY" ? "/news" : item.kind === "COMMUNITY" ? "/community" : "/recommended"}
      >
        {copy("กลับไปดูทั้งหมด", "Back to collection")}
      </Link>

      <PageHeading
        eyebrow="SISAKET STORIES & EVENTS"
        title={title}
        description={summary}
      />

      <div className="overflow-hidden rounded-2xl border border-[#e1e2d8] shadow-xs">
        <Media priority src={item.image_url} alt={item.image_alt || title} />
      </div>

      {item.location && (
        <p className="wt-muted flex items-center gap-1.5 text-xs">
          <MapPin size={14} />
          {item.location}
          {item.starts_at ? ` · ${formatDateText(item.starts_at, locale)}` : ""}
        </p>
      )}

      <div className="wt-detail wt-section whitespace-pre-line text-sm leading-relaxed text-[#193e30]">
        {body}
      </div>

      <Link className="wt-button wt-section w-full sm:w-auto" href="/hotels">
        {copy("สำรวจที่พักในระบบ", "Explore stays")}
      </Link>
    </article>
  );
}
