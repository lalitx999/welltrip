"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { getRoleRedirectPath } from "@/lib/auth-redirect";

export default function LoginPage() {
  const router = useRouter();
  const { status, user } = useAuth();
  const { t } = useI18n();
  const [justRegistered, setJustRegistered] = useState(false);

  // If a session already exists, redirect based on user role.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getRoleRedirectPath(user?.role));
    }
    if (typeof window !== "undefined") {
      setJustRegistered(window.location.search.includes("registered=1"));
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <p className="text-center text-sm text-muted-foreground">{t("common.loading")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {justRegistered && (
        <p className="rounded-md bg-secondary p-3 text-center text-sm text-secondary-foreground">
          {t("auth.registeredBanner")}
        </p>
      )}

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.loginNew")}{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("auth.createSubmit")}
        </Link>
      </p>
    </div>
  );
}
