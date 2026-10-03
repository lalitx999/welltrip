"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Compass, Flower2, House, Leaf, MapPin, Menu, Newspaper, Receipt, Settings, ShoppingBag, Sprout, UserRound, Users, Utensils, X } from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import styles from "./travel.module.css";

export function useTravelCopy() {
  const { locale } = useI18n();
  return (th: string, en: string) => locale === "th" ? th : en;
}

export function TravelShell({ children }: { children: React.ReactNode }) {
  const copy = useTravelCopy();
  const pathname = usePathname();
  const { status, user } = useAuth();
  const count = useCartStore(s => s.itemCount);
  const [panel, setPanel] = useState<"explore" | "account" | null>(null);
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const authenticated = status === "authenticated";
  const links = [
    { href: "/home", label: copy("หน้าหลัก", "Home"), icon: Compass },
    { href: "/hotels", label: copy("ที่พักชุมชน", "Places to stay"), icon: House },
    { href: "/foods", label: copy("อาหารสุขภาพ", "Local dining"), icon: Utensils },
    { href: "/wellness", label: copy("นวดและกิจกรรม", "Wellness & activities"), icon: Flower2 },
    { href: "/health", label: copy("ประเมินสุขภาพ", "Wellness assessment"), icon: Leaf },
    { href: "/recommended", label: copy("แนะนำสำหรับคุณ", "For you"), icon: Sprout },
    { href: "/otop", label: copy("ของดีชุมชน", "Local treasures"), icon: ShoppingBag },
    { href: "/news", label: copy("ข่าวและกิจกรรม", "Stories & events"), icon: Newspaper },
    { href: "/community", label: copy("รู้จักชุมชน", "Meet the community"), icon: Users },
  ];
  const accounts = [
    { href: "/profile", label: copy("บัญชีของฉัน", "My profile"), icon: UserRound },
    { href: "/my-bookings", label: copy("การจองของฉัน", "My bookings"), icon: Receipt },
    { href: "/settings", label: copy("ตั้งค่า", "Settings"), icon: Settings },
  ];
  useEffect(() => { setPanel(null); }, [pathname]);
  useEffect(() => {
    if (!panel) return;
    function closeOutside(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (!header.current?.contains(target) && !target.closest('[data-travel-toggle]')) setPanel(null);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") { setPanel(null); trigger.current?.focus(); }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", escape); };
  }, [panel]);
  function toggle(next: "explore" | "account", button: HTMLButtonElement) {
    trigger.current = button;
    setPanel(previous => previous === next ? null : next);
  }
  const active = (href: string) => pathname === href || (href !== "/home" && pathname.startsWith(href + "/"));
  const isVendor = user && ["HOMESTAY_OWNER", "RESTAURANT_OWNER", "WELLNESS_OWNER", "OTOP_OWNER", "SUPER_ADMIN"].includes(user.role);
  return <div className={styles.shell}>
    <a className={styles.skip} href="#travel-main">{copy("ข้ามไปเนื้อหา", "Skip to content")}</a>
    <header ref={header} className={styles.header}>
      <div className={styles.topbar}>
        <Link href="/home" className={styles.brand} aria-label="WellTrip home"><Sprout aria-hidden="true" /><span>WellTrip<small>SLOW DAYS · SISAKET</small></span></Link>
        <nav className={styles.desktopNav} aria-label={copy("เมนูหลัก", "Main navigation")}>
          <button data-travel-toggle aria-expanded={panel === "explore"} aria-controls="travel-explore-menu" onClick={e => toggle("explore", e.currentTarget)}>{copy("สำรวจศรีสะเกษ", "Explore Sisaket")}<ChevronDown size={14} aria-hidden="true" /></button>
          {links.filter(x => ["/hotels", "/foods", "/wellness", "/otop"].includes(x.href)).map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <LanguageToggle />
          <Link href="/cart" className={styles.iconButton} aria-label={copy(`ตะกร้า ${count} รายการ`, `Cart, ${count} items`)}><ShoppingBag size={20} aria-hidden="true" />{count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}</Link>
          <button className={styles.accountButton} data-travel-toggle aria-expanded={panel === "account"} aria-controls="travel-account-menu" onClick={e => toggle("account", e.currentTarget)}><UserRound size={19} aria-hidden="true" /><span>{copy("บัญชี", "Account")}</span><ChevronDown size={13} aria-hidden="true" /></button>
          <button className={`${styles.iconButton} ${styles.mobileMenu}`} data-travel-toggle aria-expanded={panel === "explore"} aria-controls="travel-explore-menu" aria-label={copy("เปิดเมนูสำรวจ", "Open explore menu")} onClick={e => toggle("explore", e.currentTarget)}>{panel === "explore" ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <div id="travel-explore-menu" className={styles.menuPanel} hidden={panel !== "explore"}>
        <div className={styles.menuHeading}><span>{copy("ออกไปพบศรีสะเกษในแบบของคุณ", "Discover your side of Sisaket")}</span><button className={styles.iconButton} aria-label={copy("ปิดเมนู", "Close menu")} onClick={() => { setPanel(null); trigger.current?.focus(); }}><X size={18} /></button></div>
        <nav className={styles.menuGrid} aria-label={copy("สำรวจบริการทั้งหมด", "Explore all services")}>{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} onClick={() => setPanel(null)}><Icon size={19} aria-hidden="true" />{label}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}</nav>
      </div>
      <div id="travel-account-menu" className={`${styles.menuPanel} ${styles.accountPanel}`} hidden={panel !== "account"}>
        <p className={styles.menuHeading}>{authenticated ? (user?.first_name || copy("ยินดีต้อนรับ", "Welcome")) : copy("ทริปครั้งใหม่เริ่มที่นี่", "Your next journey starts here")}</p>
        {!authenticated && <Link className={styles.primary} href="/login" onClick={() => setPanel(null)}>{copy("เข้าสู่ระบบ / สมัครสมาชิก", "Sign in / Sign up")}</Link>}
        <nav className={styles.accountLinks} aria-label={copy("เมนูบัญชี", "Account navigation")}>{accounts.map(({href, label, icon: Icon}) => <Link href={href} key={href} onClick={() => setPanel(null)}><Icon size={18} aria-hidden="true" />{label}</Link>)}{isVendor && <Link href="/portal" onClick={() => setPanel(null)}><House size={18} />{copy("ศูนย์ผู้ประกอบการ", "Vendor portal")}</Link>}</nav>
      </div>
    </header>
    <main id="travel-main" className={styles.main}>{children}</main>
    <footer className={styles.footer}>
      <div className={styles.footerTop}><div><Link href="/home" className={styles.brand}><Sprout aria-hidden="true" /><span>WellTrip<small>SLOW DAYS · SISAKET</small></span></Link><p>{copy("เดินทางช้าลง รู้จักผู้คนมากขึ้น\nเติมความสุขให้ตัวเองและชุมชน", "Travel slower. Connect a little deeper.\nFind joy for yourself and the community.")}</p></div><div><span className={styles.eyebrow}>{copy("ออกเดินทาง", "EXPLORE")}</span><Link href="/hotels">{copy("ที่พักชุมชน", "Places to stay")}</Link><Link href="/foods">{copy("อาหารพื้นถิ่น", "Local dining")}</Link><Link href="/wellness">{copy("นวดและกิจกรรม", "Wellness & activities")}</Link></div><div><span className={styles.eyebrow}>{copy("เชื่อมถึงชุมชน", "CONNECT")}</span><Link href="/community">{copy("รู้จักชุมชน", "Our communities")}</Link><Link href="/otop">{copy("ของดีชุมชน", "Local treasures")}</Link><Link href="/news">{copy("ข่าวและกิจกรรม", "Stories & events")}</Link></div></div>
      <div className={styles.footerBottom}><span>© {new Date().getFullYear()} WellTrip</span><span><MapPin size={14} aria-hidden="true" />{copy("ศรีสะเกษ ประเทศไทย", "Sisaket, Thailand")}</span></div>
    </footer>
    <nav className={styles.bottomNav} aria-label={copy("เมนูมือถือ", "Mobile navigation")}>
      <Link href="/home" aria-current={active("/home") ? "page" : undefined}><Compass aria-hidden="true" /><span>{copy("หน้าหลัก", "Home")}</span></Link>
      <button data-travel-toggle aria-expanded={panel === "explore"} aria-controls="travel-explore-menu" onClick={e => toggle("explore", e.currentTarget)}><Leaf aria-hidden="true" /><span>{copy("สำรวจ", "Explore")}</span></button>
      <Link href="/my-bookings" aria-current={active("/my-bookings") ? "page" : undefined}><Receipt aria-hidden="true" /><span>{copy("การจอง", "Bookings")}</span></Link>
      <Link href="/cart" aria-current={active("/cart") ? "page" : undefined}><span className={styles.cartIcon}><ShoppingBag aria-hidden="true" />{count > 0 && <i className={styles.badge}>{count > 99 ? "99+" : count}</i>}</span><span>{copy("ตะกร้า", "Cart")}</span></Link>
      <button data-travel-toggle aria-expanded={panel === "account"} aria-controls="travel-account-menu" onClick={e => toggle("account", e.currentTarget)}><UserRound aria-hidden="true" /><span>{copy("บัญชี", "Account")}</span></button>
    </nav>
  </div>;
}
