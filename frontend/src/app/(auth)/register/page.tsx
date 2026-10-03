"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { t } = useI18n();

  // Authenticated users have no business on the register page.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <p className="text-center text-sm text-muted-foreground">{t("common.loading")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.registerHas")}{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("auth.signinTitle")}
        </Link>
      </p>
    </div>
  );
}
