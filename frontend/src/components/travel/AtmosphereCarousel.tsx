"use client";

/**
 * AtmosphereCarousel.tsx
 * Seamless 4-Slide Atmosphere Carousel showcasing rural Isan & Sisaket nature.
 * Uses images from /c/ (fields, village, rice, sunset) with 4:5 mobile aspect ratio
 * and Eco-Premium styling.
 * Zero-Emoji Policy: Lucide icons only.
 */
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

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
    description: "สัมผัสบรรยากาศความสงบกลางผืนนาสีทองสุกอร่าม ลมพัดพลิ้วไหวและแสงแดดอบอุ่นสาดส่องผืนดินศรีสะเกษ",
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

export function AtmosphereCarousel() {
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
    <div className="relative overflow-hidden rounded-3xl bg-forest-950 border border-gold-500/30 shadow-xl group">
      {/* Background Image Showcase */}
      <div className="relative aspect-[4/5] sm:aspect-[16/9] w-full overflow-hidden bg-forest-900">
        <picture>
          <source media="(max-width: 640px)" srcSet={slide.mobileImg} />
          <img
            src={slide.desktopImg}
            alt={slide.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
          />
        </picture>

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-transparent" />

        {/* Top Tag Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-forest-900/80 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            <span>{slide.tag}</span>
          </span>
        </div>

        {/* Slide Content Caption */}
        <div className="absolute bottom-6 left-6 right-6 z-10 space-y-2 text-cream-50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>{slide.subtitle}</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-cream-100 leading-tight">
            {slide.title}
          </h3>
          <p className="text-xs sm:text-sm text-cream-200/90 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
            {slide.description}
          </p>
        </div>

        {/* Arrow Navigation Controls */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-cream-100/20 bg-forest-900/60 text-cream-100 backdrop-blur-md transition-all hover:bg-gold-500 hover:text-forest-950"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full border border-cream-100/20 bg-forest-900/60 text-cream-100 backdrop-blur-md transition-all hover:bg-gold-500 hover:text-forest-950"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots Indicator Bar */}
      <div className="flex items-center justify-between bg-forest-900/90 px-6 py-3 border-t border-gold-500/20">
        <div className="flex items-center gap-2">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentSlide === idx ? "w-8 bg-gold-400" : "w-2 bg-cream-100/30 hover:bg-cream-100/60"
              )}
            />
          ))}
        </div>

        <span className="text-[11px] font-mono font-semibold text-gold-300 flex items-center gap-1">
          <Compass className="h-3.5 w-3.5 text-gold-400" />
          <span>บรรยากาศธรรมชาติอีสาน · ศรีสะเกษ</span>
        </span>
      </div>
    </div>
  );
}
