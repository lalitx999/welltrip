"use client";

/**
 * TouristAuthGuard - enforces login for tourist platform routes.
 * Redirects unauthenticated guests to /login.
 */
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function TouristAuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPage = ["/home", "/hotels", "/foods", "/wellness", "/otop", "/news", "/community", "/recommended", "/stories", "/cart"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  useEffect(() => {
    if (status === "guest" && !publicPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname, publicPage]);

  if (publicPage) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-background p-6 font-serif text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-forest-800" />
          <p>กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
        </div>
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <ShieldAlert className="h-12 w-12 text-forest-800" />
        <h2 className="font-serif text-xl font-bold text-foreground">
          กรุณาเข้าสู่ระบบก่อนเข้าใช้งาน
        </h2>
        <p className="max-w-md text-xs text-muted-foreground">
          เข้าสู่ระบบเพื่อจัดการข้อมูลส่วนตัวและรายการจองของคุณ
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
