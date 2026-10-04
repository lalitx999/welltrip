"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Sprout, Menu, X } from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useI18n } from "@/lib/i18n";
import styles from "./sisaket.module.css";

/**
 * Local translator for the Sisaket feature.
 * Copy is intentionally isolated from the shared dictionary while feature
 * development is still in progress.
 */
export function useSisaketCopy() {
  const { locale } = useI18n();
  return useCallback(
    (th: string, en: string) => (locale === "th" ? th : en),
    [locale]
  );
}

export function SisaketHeader({ authenticated = false }: { authenticated?: boolean }) {
  const copy = useSisaketCopy();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  // useId กัน id ซ้ำถ้ามี header มากกว่าหนึ่งตัวในหน้าเดียว
  const navId = useId();

  const closeMenu = useCallback(() => setOpen(false), []);

  // Close the drawer when the viewport grows into desktop territory.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setOpen(false);
    };
    handleChange(mq);

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }
    // Fallback สำหรับ Safari <= 13 ที่ยังไม่มี addEventListener บน MediaQueryList
    mq.addListener(handleChange);
    return () => mq.removeListener(handleChange);
  }, []);

  // Close the drawer on outside click / touch.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  // Close the drawer on Escape and return focus to the toggle button.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className={styles.header} ref={headerRef}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <Sprout aria-hidden="true" />
          <span>
            WellTrip<small>SLOW DAYS · SISAKET</small>
          </span>
        </Link>

        <div className={styles.headerRight}>
          <nav
            id={navId}
            aria-label={copy("เมนูหลัก", "Main navigation")}
            className={`${styles.nav} ${open ? styles.navOpen : ""}`}
          >
            <Link href="/" onClick={closeMenu}>
              {copy("หน้าแรก", "Home")}
            </Link>
            <Link
              href="/login/merchant"
              onClick={closeMenu}
              className={styles.merchantLink}
            >
              {copy("สำหรับผู้ประกอบการ", "For Merchants")}
            </Link>
            {authenticated ? (
              <Link
                className={styles.primary}
                href="/home"
                onClick={closeMenu}
              >
                {copy("ทริปของคุณ", "Explore")}
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu}>
                  {copy("เข้าสู่ระบบ", "Sign in")}
                </Link>
                <Link
                  className={styles.primary}
                  href="/register"
                  onClick={closeMenu}
                >
                  {copy("สมัครสมาชิก", "Sign up")}
                </Link>
              </>
            )}
          </nav>

          <LanguageToggle />

          <button
            ref={hamburgerRef}
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? copy("ปิดเมนู", "Close menu") : copy("เปิดเมนู", "Open menu")}
            aria-expanded={open}
            aria-controls={navId}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function NaturePhoto({
  title,
  subtitle,
  arch = false,
  priority = false,
}: {
  title: string;
  subtitle: string;
  arch?: boolean;
  priority?: boolean;
}) {
  const copy = useSisaketCopy();
  return (
    <figure className={`${styles.photo} ${arch ? styles.arch : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sisaket-nature-concept.webp"
        alt=""
        width={900}
        height={1350}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
      />
      <figcaption>
        <span className={styles.eyebrow}>{subtitle}</span>
        <h2>{title}</h2>
        <small>
          {copy(
            "ภาพจำลองด้วย AI · แรงบันดาลใจจากชนบทอีสาน",
            "AI-created image · Inspired by rural Isan"
          )}
        </small>
      </figcaption>
    </figure>
  );
}

export function SisaketFooter() {
  const copy = useSisaketCopy();
  return (
    <footer className={styles.footer}>
      <span>
        {copy(
          "WellTrip · เดินทางช้าลง สุขได้มากขึ้น",
          "WellTrip · Slow down. Find a little more joy."
        )}
      </span>
      <span>{copy("ศรีสะเกษ ประเทศไทย", "Sisaket, Thailand")}</span>
    </footer>
  );
}