"use client";

/**
 * AtmosphereCarousel.tsx
 * High-Contrast Eco-Premium 4-Slide Atmosphere Hero Carousel.
 * Uses images from /c/ (fields, village, rice, sunset) with 4:5 mobile aspect ratio
 * and rich dark gradient overlays for 100% text legibility.
 * Zero-Emoji Policy: Lucide icons only.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Compass, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTravelCopy } from "@/components/travel/travel-shell";

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  desktopImg: string;
  mobileImg: string;
  tag: string;
}

const CAROUSEL_SLIDES: SlideData[] = [
  {
    id: 1,
    title: "ผืนนาสีทองแห่งอีสานใต้",
    subtitle: "ทุ่งนาข้าวหอมอบอุ่นยามเช้า",
    description: "สัมผัสความสงบกลางผืนนาสีทองสุกอร่าม ลมพัดพลิ้วไหวและแสงแดดอบอุ่นสาดส่องผืนดินศรีสะเกษ",
    desktopImg: "/c/fields.webp",
    mobileImg: "/c/fields-mobile.webp",
    tag: "ฉากเปิดความงดงาม · 01/04",
  },
  {
    id: 2,
    title: "วิถีชีวิตและความสงบในหมู่บ้าน",
    subtitle: "เสน่ห์แห่งชุมชนสโลว์ไลฟ์",
    description: "ตื่นเช้ารับลมธรรมชาติ สัมผัสความอบอุ่นของชาวบ้าน วิถีชีวิตเรียบง่าย และรอยยิ้มอันจริงใจแห่งเมืองศรีสะเกษ",
    desktopImg: "/c/village.webp",
    mobileImg: "/c/village-mobile.webp",
    tag: "วิถีชีวิตชุมชน · 02/04",
  },
  {
    id: 3,
    title: "สัมผัสรวงข้าวอินทรีย์ใกล้ชิด",
    subtitle: "ความประณีตแห่งผลผลิตเกษตร",
    description: "หยาดน้ำค้างสะท้อนแสงแดดยามเช้าบนรวงข้าวสุกเต็มวัย ผลผลิตอินทรีย์จากความตั้งใจของเกษตรกรท้องถิ่น",
    desktopImg: "/c/rice.webp",
    mobileImg: "/c/rice-mobile.webp",
    tag: "รายละเอียดธรรมชาติ · 03/04",
  },
  {
    id: 4,
    title: "พระอาทิตย์ตกดินอันงดงาม",
    subtitle: "สายน้ำและทัศนียภาพตระการตา",
    description: "ทัศนียภาพยามเย็นเมื่อพระอาทิตย์ลับขอบฟ้า แสงสีทองละมุนสะท้อนผิวน้ำและทิวเขา สร้างความทรงจำประทับใจ",
    desktopImg: "/c/sunset.webp",
    mobileImg: "/c/sunset-mobile.webp",
    tag: "วิวทิวทัศน์ส่งท้าย · 04/04",
  },
];

interface AtmosphereCarouselProps {
  heroMode?: boolean;
}

export function AtmosphereCarousel({ heroMode = true }: AtmosphereCarouselProps) {
  const copy = useTravelCopy();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  function nextSlide() {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  }

  function prevSlide() {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  }

  const slide = CAROUSEL_SLIDES[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-forest-950 border border-gold-500/40 shadow-2xl group">
      {/* Carousel Showcase Area */}
      <div className="relative min-h-[520px] sm:min-h-[560px] w-full overflow-hidden bg-forest-950 flex items-center">
        {/* Background Image Slides (Fade effect) */}
        {CAROUSEL_SLIDES.map((s, idx) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              idx === currentSlide ? "opacity-100 z-0 scale-100" : "opacity-0 -z-10 scale-105 pointer-events-none"
            )}
          >
            <picture>
              <source media="(max-width: 640px)" srcSet={s.mobileImg} />
              <img
                src={s.desktopImg}
                alt={s.title}
                className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-103"
              />
            </picture>
          </div>
        ))}

        {/* Multi-Layer Dark Gradient Overlay for Maximum Text Contrast */}
        {/* Left-to-Right Heavy Dark Forest Overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to right, rgba(11, 26, 19, 0.96) 0%, rgba(11, 26, 19, 0.82) 45%, rgba(11, 26, 19, 0.45) 75%, rgba(11, 26, 19, 0.15) 100%)",
          }}
        />
        {/* Bottom Vignette Gradient */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: "linear-gradient(to top, rgba(11, 26, 19, 0.95) 0%, transparent 45%)",
          }}
        />
        {/* Top Subtle Vignette */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: "linear-gradient(to bottom, rgba(11, 26, 19, 0.7) 0%, transparent 35%)",
          }}
        />

        {/* Hero Content Overlay */}
        <div className="relative z-20 w-full max-w-3xl px-6 sm:px-12 py-10 sm:py-14 space-y-5">
          {/* Eyebrow / Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/60 bg-forest-950/90 px-3.5 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              <span>SISAKET RESONANCE · 4 ETHNIC TRIBES</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-400/30 bg-forest-900/80 px-3 py-1 text-[11px] font-mono text-cream-100 backdrop-blur-md">
              <MapPin className="h-3 w-3 text-gold-400" />
              <span>{slide.tag}</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.25] drop-shadow-xl">
            {copy("เที่ยวให้ช้าลง", "Slow down.")}
            <br />
            <span className="font-bold text-gold-400 drop-shadow-lg">
              {copy("สุขให้มากขึ้น ที่ศรีสะเกษ", "Find more joy in Sisaket.")}
            </span>
          </h1>

          {/* Subtitle & Description */}
          <p className="text-xs sm:text-base text-cream-100/95 leading-relaxed max-w-xl font-light drop-shadow-md">
            {copy(
              `สัมผัสวิถีชีวิต 4 ชนเผ่า (เขมร ลาว ส่วย เยอ) — ${slide.title}: ${slide.description}`,
              `Discover 4 ethnic cultures & ${slide.subtitle} in Sisaket.`
            )}
          </p>

          {/* Action Callouts */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a
              href="#sisaket-catalog-sections"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold px-6 py-3.5 text-xs sm:text-sm shadow-xl transition-all hover:scale-105"
            >
              <span>{copy("ค้นพบประสบการณ์", "Discover experiences")}</span>
              <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
            </a>
            <Link
              href="/community"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-400/50 bg-forest-900/80 hover:bg-forest-800 text-gold-200 hover:text-white px-6 py-3.5 text-xs sm:text-sm font-semibold backdrop-blur-md transition-all shadow-md"
            >
              <span>{copy("13 หมู่บ้าน OTOP นวัตวิถี", "13 OTOP Villages")}</span>
            </Link>
          </div>
        </div>

        {/* Arrow Navigation Controls */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full border border-gold-500/40 bg-forest-950/80 text-gold-300 backdrop-blur-md transition-all hover:bg-gold-500 hover:text-forest-950 hover:scale-110 shadow-xl"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full border border-gold-500/40 bg-forest-950/80 text-gold-300 backdrop-blur-md transition-all hover:bg-gold-500 hover:text-forest-950 hover:scale-110 shadow-xl"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Dots Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#08140E] px-6 py-3.5 border-t border-gold-500/30">
        <div className="flex items-center gap-2.5">
          {CAROUSEL_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${s.title}`}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                currentSlide === idx
                  ? "w-8 bg-gold-400 shadow-[0_0_10px_rgba(206,175,108,0.8)]"
                  : "w-2.5 bg-gold-500/25 hover:bg-gold-400/60"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gold-300">
          <Compass className="h-4 w-4 text-gold-400 animate-spin-slow" />
          <span className="hidden sm:inline text-cream-200/80">{slide.subtitle} · </span>
          <span className="font-semibold text-gold-300">{slide.title}</span>
        </div>
      </div>
    </div>
  );
}
