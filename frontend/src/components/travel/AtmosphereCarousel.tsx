"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTravelCopy } from "./travel-shell";
import "./carousel.css";

// Brand atmosphere assets only. No product, availability or location claims.
const slides = [
  { image: "fields", th: "เที่ยวให้ช้าลง สุขให้มากขึ้น", en: "Slow down. Find a little more joy.", caption: "THE WIDE OPEN", altTh: "ภาพสร้างบรรยากาศทุ่งนาในแสงอุ่น", altEn: "Illustrative rice fields in warm light" },
  { image: "village", th: "ใกล้ธรรมชาติ ใกล้ผู้คน", en: "Closer to nature. Closer to people.", caption: "A GENTLER RHYTHM", altTh: "ภาพสร้างบรรยากาศวิถีชนบท", altEn: "Illustrative rural life" },
  { image: "rice", th: "ความสุข ในรายละเอียดเล็ก ๆ", en: "Find joy in the little things.", caption: "LITTLE WONDERS", altTh: "ภาพสร้างบรรยากาศรวงข้าวระยะใกล้", altEn: "Illustrative close-up of rice" },
  { image: "sunset", th: "พักใจ ไปกับแสงสุดท้าย", en: "Stay for the last light.", caption: "THE LAST LIGHT", altTh: "ภาพสร้างบรรยากาศวิวสายน้ำยามเย็น ไม่ระบุสถานที่จริง", altEn: "Illustrative sunset landscape, not a verified destination" },
];
export function AtmosphereCarousel({ heroMode = true }: { heroMode?: boolean }) {
  const copy = useTravelCopy();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const go = (next: number) => {
    const target = Math.max(0, Math.min(slides.length - 1, next));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollTo({left: target * track.current.clientWidth, behavior: reduce ? "auto" : "smooth"});
  };
  return <div className="wt-carousel" role="region" aria-roledescription="carousel" aria-label={copy("บรรยากาศการเดินทาง", "Travel atmosphere")}>
    <div className="wt-carousel-track" ref={track} onScroll={event => { const el = event.currentTarget; if (el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth)); }}>
      {slides.map((slide, i) => <div className="wt-carousel-slide" key={slide.image} role="group" aria-roledescription="slide" aria-label={`${i+1} / ${slides.length}`}>
        <picture><source media="(max-width: 640px)" srcSet={`/images/${slide.image}-mobile.webp`} /><img src={`/images/${slide.image}.webp`} alt={copy(slide.altTh,slide.altEn)} width={1200} height={1500} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "low"} decoding="async" /></picture>
        <div className="wt-carousel-copy"><span>{slide.caption}</span>{heroMode && i === 0 ? <h1 id="travel-home-title">{copy(slide.th,slide.en)}</h1> : <h2>{copy(slide.th,slide.en)}</h2>}<Link tabIndex={index === i ? 0 : -1} href="/hotels">{copy("ค้นหาที่พัก", "Explore stays")}<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      </div>)}
    </div>
    <div className="wt-carousel-controls"><button aria-label={copy("ภาพก่อนหน้า", "Previous image")} disabled={index === 0} onClick={() => go(index-1)}><ChevronLeft size={18} /></button><div>{slides.map((s,i) => <button key={s.image} onClick={() => go(i)} aria-label={copy(`ดูภาพ ${i+1}`, `Go to image ${i+1}`)} aria-pressed={index === i}><span /></button>)}</div><button aria-label={copy("ภาพถัดไป", "Next image")} disabled={index === slides.length-1} onClick={() => go(index+1)}><ChevronRight size={18} /></button></div>
    <p className="wt-carousel-credit">{copy("ภาพสร้างบรรยากาศด้วย AI ไม่ใช่ภาพยืนยันสถานที่หรือบริการ", "AI-created atmosphere, not verified destination or service photography")}</p>
  </div>;
}
