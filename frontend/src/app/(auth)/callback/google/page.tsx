"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { extractApiErrorMessage } from "@/lib/auth-api";
import { useI18n } from "@/lib/i18n";
import { getRoleRedirectPath } from "@/lib/auth-redirect";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { status, user, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      if (status === "authenticated") {
        router.replace(getRoleRedirectPath(user?.role));
        return;
      }
      if (status !== "guest") {
        return; // still hydrating; effect will re-run once status settles
      }

      const params = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const idToken = params.get("id_token");

      if (!idToken) {
        setError(t("google.noToken"));
        return;
      }

      try {
        const loggedUser = await loginWithGoogle(idToken);
        if (!cancelled) {
          router.replace(getRoleRedirectPath(loggedUser?.role));
        }
      } catch (err) {
        if (!cancelled) {
          setError(extractApiErrorMessage(err));
        }
      }
    }

    void handleCallback();
    return () => {
      cancelled = true;
    };
  }, [status, user, loginWithGoogle, router, t]);

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.replace("/login")}>
          {t("google.backToSignin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{t("google.completing")}</span>
    </div>
  );
}
