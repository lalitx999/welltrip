"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useI18n } from "@/lib/i18n";
import styles from "./sisaket.module.css";

// Copy is isolated from the shared dictionary while feature development continues.
export function useSisaketCopy() {
  const { locale } = useI18n();
  return (th: string, en: string) => locale === "th" ? th : en;
}

export function SisaketHeader({ authenticated = false }: { authenticated?: boolean }) {
  const copy = useSisaketCopy();
  return <header className={styles.header}><div className={styles.headerInner}>
    <Link href="/" className={styles.brand}><Sprout aria-hidden="true" /><span>WellTrip<small>SLOW DAYS · SISAKET</small></span></Link>
    <nav aria-label={copy("เมนูหลัก", "Main navigation")} className={styles.nav}>
      <Link href="/">{copy("หน้าแรก", "Home")}</Link>
      {authenticated ? <Link className={styles.primary} href="/home">{copy("ทริปของคุณ", "Explore")}</Link> : <><Link href="/login">{copy("เข้าสู่ระบบ", "Sign in")}</Link><Link className={styles.primary} href="/register">{copy("สมัครสมาชิก", "Sign up")}</Link></>}
      <LanguageToggle />
    </nav>
  </div></header>;
}

export function NaturePhoto({ title, subtitle, arch = false }: { title: string; subtitle: string; arch?: boolean }) {
  const copy = useSisaketCopy();
  return <figure className={`${styles.photo} ${arch ? styles.arch : ""}`}>
    {/* A local, optimized WebP keeps the same asset available on all three routes. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/images/sisaket-nature-concept.webp" alt={copy("ภาพธรรมชาติจำลองด้วย AI: ทุ่งนาเขียวในแสงเช้า", "AI-created nature scene: green rice fields in the morning light")} width={900} height={1350} fetchPriority="high" />
    <figcaption><span className={styles.eyebrow}>{subtitle}</span><h2>{title}</h2><small>{copy("ภาพจำลองด้วย AI · แรงบันดาลใจจากชนบทอีสาน", "AI-created image · Inspired by rural Isan")}</small></figcaption>
  </figure>;
}

export function SisaketFooter() {
  const copy = useSisaketCopy();
  return <footer className={styles.footer}><span>{copy("WellTrip · เดินทางช้าลง สุขได้มากขึ้น", "WellTrip · Slow down. Find a little more joy.")}</span><span>{copy("ศรีสะเกษ ประเทศไทย", "Sisaket, Thailand")}</span></footer>;
}
