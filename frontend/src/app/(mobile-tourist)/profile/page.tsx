"use client";

/**
 * (mobile-tourist)/profile/page.tsx - minimal profile (Phase 1: account info +
 * logout). Keeps the bottom-nav Profile tab from dead-ending at a 404.
 * Phase 2 can grow avatar/photo upload etc. without touching auth files.
 */
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDateText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { status, user, logout } = useAuth();

  if (status === "loading") {
    return <div className="px-4 pb-8 pt-5" />;
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex flex-col items-center gap-4 px-8 pt-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">{t("profile.needLogin")}</p>
        <Link href="/login">
          <Button>{t("profile.goLogin")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("profile.title")}
      </h1>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
            {(user.first_name || user.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-card-foreground">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <dl className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("profile.email")}</dt>
          <dd className="break-all text-right text-card-foreground">
            {user.email}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("profile.role")}</dt>
          <dd className="text-card-foreground">{user.role}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("profile.memberSince")}</dt>
          <dd className="text-card-foreground">
            {formatDateText(user.created_at, locale)}
          </dd>
        </div>
      </dl>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          logout();
          router.replace("/");
        }}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("home.logout")}
      </Button>
    </div>
  );
}
