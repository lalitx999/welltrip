"use client";

/**
 * AtmosphereCarousel.tsx
 * 4-Slide Isan Nature & Atmosphere Hero Carousel for Sisaket.
 * Features 4-slide seamless storytelling (fields, village, rice, sunset)
 * with 4:5 mobile optimization, Eco-Premium styling, and Zero-Emoji policy.
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
    <div className="relative overflow-hidden rounded-3xl bg-forest-950 border border-gold-500/30 shadow-2xl group">
      {/* Carousel Background Images (Crossfade Transition) */}
      <div className="relative min-h-[520px] sm:min-h-[560px] w-full overflow-hidden bg-forest-900 flex items-center">
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

        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-forest-950/90 via-forest-950/65 to-forest-950/30 sm:from-forest-950/95 sm:via-forest-950/70 sm:to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-forest-950/90 via-transparent to-forest-950/40" />

        {/* Main Hero Banner Content Overlay */}
        <div className="relative z-20 w-full max-w-3xl px-6 sm:px-12 py-10 sm:py-14 space-y-5 text-cream-50">
          {/* Eyebrow / Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-forest-900/80 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-gold-400" />
              <span>SISAKET RESONANCE · 4 ETHNIC TRIBES</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-cream-100/20 bg-forest-950/60 px-2.5 py-1 text-[11px] text-cream-200 backdrop-blur-md">
              <MapPin className="h-3 w-3 text-gold-400" />
              <span>{slide.tag}</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-cream-100 leading-[1.2] drop-shadow-md">
            {copy("เที่ยวให้ช้าลง", "Slow down.")}
            <br />
            <span className="font-semibold text-gold-300">{copy("สุขให้มากขึ้น ที่ศรีสะเกษ", "Find more joy in Sisaket.")}</span>
          </h1>

          {/* Subtitle / Description combining 4 tribes & current slide details */}
          <p className="text-xs sm:text-base text-cream-200/95 leading-relaxed max-w-xl drop-shadow">
            {copy(
              `สัมผัสวิถีชีวิต 4 ชนเผ่า (เขมร ลาว ส่วย เยอ) ${slide.title} — ${slide.description}`,
              `Discover 4 ethnic cultures & ${slide.subtitle} in Sisaket.`
            )}
          </p>

          {/* Action Callouts */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#sisaket-catalog-sections"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cream-100 px-6 py-3 text-xs sm:text-sm font-semibold text-forest-950 shadow-lg transition-all hover:bg-gold-400 hover:text-forest-950 hover:scale-102"
            >
              <span>{copy("ค้นพบประสบการณ์", "Discover experiences")}</span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href="/community"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cream-100/40 bg-forest-900/40 px-6 py-3 text-xs sm:text-sm font-semibold text-cream-100 backdrop-blur-md transition-all hover:bg-forest-800/80 hover:border-gold-400"
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
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full border border-cream-100/20 bg-forest-950/60 text-cream-100 backdrop-blur-md transition-all hover:bg-gold-500 hover:text-forest-950"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full border border-cream-100/20 bg-forest-950/60 text-cream-100 backdrop-blur-md transition-all hover:bg-gold-500 hover:text-forest-950"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Dots Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-forest-950 px-6 py-3.5 border-t border-gold-500/20">
        <div className="flex items-center gap-2">
          {CAROUSEL_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${s.title}`}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                currentSlide === idx ? "w-8 bg-gold-400" : "w-2.5 bg-cream-100/30 hover:bg-cream-100/60"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-gold-300">
          <Compass className="h-3.5 w-3.5 text-gold-400 animate-pulse" />
          <span className="hidden sm:inline">{slide.subtitle} · </span>
          <span>{slide.title}</span>
        </div>
      </div>
    </div>
  );
}
