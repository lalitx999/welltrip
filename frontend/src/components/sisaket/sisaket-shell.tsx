"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout, Menu, X } from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useI18n } from "@/lib/i18n";
import styles from "./sisaket.module.css";

// Copy is isolated from the shared dictionary while feature development continues.
export function useSisaketCopy() {
  const { locale } = useI18n();
  return (th: string, en: string) => (locale === "th" ? th : en);
}

export function SisaketHeader({ authenticated = false }: { authenticated?: boolean }) {
  const copy = useSisaketCopy();
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          <Sprout aria-hidden="true" />
          <span>
            WellTrip<small>SLOW DAYS · SISAKET</small>
          </span>
        </Link>

        <div className={styles.headerRight}>
          <LanguageToggle />
          <button
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setOpen(!open)}
            aria-label={open ? copy("ปิดเมนู", "Close menu") : copy("เปิดเมนู", "Open menu")}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav
          aria-label={copy("เมนูหลัก", "Main navigation")}
          className={`${styles.nav} ${open ? styles.navOpen : ""}`}
        >
          <Link href="/" onClick={() => setOpen(false)}>
            {copy("หน้าแรก", "Home")}
          </Link>
          <Link
            href="/login/merchant"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold text-[#224e39] bg-[#edf0e3] border border-[#d8ddce] px-3.5 py-2 rounded-lg hover:bg-[#dfe2d5] transition inline-flex items-center justify-center"
          >
            {copy("สำหรับผู้ประกอบการ", "For Merchants")}
          </Link>
          {authenticated ? (
            <Link className={styles.primary} href="/home" onClick={() => setOpen(false)}>
              {copy("ทริปของคุณ", "Explore")}
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                {copy("เข้าสู่ระบบ", "Sign in")}
              </Link>
              <Link className={styles.primary} href="/register" onClick={() => setOpen(false)}>
                {copy("สมัครสมาชิก", "Sign up")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function NaturePhoto({ title, subtitle, arch = false }: { title: string; subtitle: string; arch?: boolean }) {
  const copy = useSisaketCopy();
  return (
    <figure className={`${styles.photo} ${arch ? styles.arch : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sisaket-nature-concept.webp"
        alt={copy("ภาพธรรมชาติจำลองด้วย AI: ทุ่งนาเขียวในแสงเช้า", "AI-created nature scene: green rice fields in the morning light")}
        width={900}
        height={1350}
        fetchPriority="high"
      />
      <figcaption>
        <span className={styles.eyebrow}>{subtitle}</span>
        <h2>{title}</h2>
        <small>{copy("ภาพจำลองด้วย AI · แรงบันดาลใจจากชนบทอีสาน", "AI-created image · Inspired by rural Isan")}</small>
      </figcaption>
    </figure>
  );
}

export function SisaketFooter() {
  const copy = useSisaketCopy();
  return (
    <footer className={styles.footer}>
      <span>{copy("WellTrip · เดินทางช้าลง สุขได้มากขึ้น", "WellTrip · Slow down. Find a little more joy.")}</span>
      <span>{copy("ศรีสะเกษ ประเทศไทย", "Sisaket, Thailand")}</span>
    </footer>
  );
}
