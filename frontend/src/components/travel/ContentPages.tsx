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

  const items = q.data?.data ?? [];

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

      {q.isLoading ? (
        <ListLoading />
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <h3 className="font-semibold text-lg text-[#1f2925]">{copy("ยังไม่มีบทความในหมวดหมู่นี้", "No content found")}</h3>
          <p className="text-xs text-slate-500">{copy("ขณะนี้ชุมชนและผู้ดูแลกำลังเตรียมเผยแพร่เนื้อหาใหม่", "New stories will be published soon.")}</p>
        </div>
      ) : (
        <div className="wt-grid">
          {items.map((item) => {
            const title = locale === "en" ? item.title_en || item.title : item.title;
            const summary = locale === "en" ? item.summary_en || item.summary : item.summary;
            return (
              <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#c49a45]/50 flex flex-col justify-between" key={item.id}>
                <div>
                  <Link href={`/stories/${item.id}`} aria-label={title} className="block overflow-hidden rounded-2xl mb-4 group">
                    <Media src={item.image_url} alt={item.image_alt || title} />
                  </Link>
                  {item.starts_at && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c49a45] mb-2 bg-[#1f2925]/5 px-3 py-1 rounded-full">
                      <Calendar size={13} />
                      {formatDateText(item.starts_at, locale)}
                    </span>
                  )}
                  <h2 className="font-semibold text-lg text-[#1f2925] mb-2 group-hover:text-[#c49a45] transition-colors">{title}</h2>
                  {item.location && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <MapPin size={13} className="text-[#c49a45]" />
                      {item.location}
                    </p>
                  )}
                  <p className="text-sm line-clamp-3 leading-relaxed text-slate-600 mb-4">{summary}</p>
                </div>
                <Link className="inline-flex items-center justify-between w-full min-h-[44px] px-5 rounded-2xl bg-[#faf9f6] text-[#1f2925] font-semibold text-sm hover:bg-[#1f2925] hover:text-[#faf9f6] transition-all border border-slate-200/60" href={`/stories/${item.id}`}>
                  <span>{copy("อ่านเรื่องราว", "Read more")}</span>
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

  const item = q.data?.data;

  if (q.isLoading) return <ListLoading />;
  if (!item) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 max-w-xl mx-auto my-12">
        <h3 className="font-semibold text-lg text-[#1f2925]">{copy("ไม่พบบทความที่คุณค้นหา", "Story not found")}</h3>
        <Link href="/news" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#1f2925] text-[#faf9f6] text-xs font-bold">
          {copy("กลับไปดูข่าวสารทั้งหมด", "Back to all stories")}
        </Link>
      </div>
    );
  }

  const title = locale === "en" ? item.title_en || item.title : item.title;
  const summary = locale === "en" ? item.summary_en || item.summary : item.summary;
  const body = locale === "en" ? item.body_en || item.body : item.body;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#faf9f6] text-[#1f2925] font-semibold text-sm hover:bg-[#1f2925] hover:text-[#faf9f6] transition-all border border-slate-200/60"
        href={item.kind === "STORY" ? "/news" : item.kind === "COMMUNITY" ? "/community" : "/recommended"}
      >
        {copy("กลับไปดูทั้งหมด", "Back to collection")}
      </Link>

      <PageHeading
        eyebrow="SISAKET STORIES & EVENTS"
        title={title}
        description={summary}
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-md">
        <Media priority src={item.image_url} alt={item.image_alt || title} />
      </div>

      {item.location && (
        <p className="flex items-center gap-2 text-sm text-[#c49a45] font-medium bg-[#1f2925] text-white px-4 py-2 rounded-2xl w-fit">
          <MapPin size={16} />
          {item.location}
          {item.starts_at ? ` · ${formatDateText(item.starts_at, locale)}` : ""}
        </p>
      )}

      <div className="whitespace-pre-line text-slate-700 leading-relaxed text-base bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        {body}
      </div>

      <Link className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-2xl bg-[#1f2925] text-[#faf9f6] font-semibold text-sm hover:bg-[#2b3832] transition-all shadow-md" href="/hotels">
        {copy("สำรวจที่พักในระบบ", "Explore stays")}
      </Link>
    </article>
  );
}
