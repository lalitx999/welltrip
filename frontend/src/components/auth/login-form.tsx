"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { GoogleLoginButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { extractApiErrorMessage } from "@/lib/auth-api";
import { useI18n } from "@/lib/i18n";
import { getRoleRedirectPath } from "@/lib/auth-redirect";
import { createLoginSchema, type LoginInput } from "@/schemas/auth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);

  const loginSchema = useMemo(
    () =>
      createLoginSchema({
        emailRequired: t("valid.emailRequired"),
        emailInvalid: t("valid.emailInvalid"),
        passwordRequired: t("valid.passwordRequired"),
        passwordMin: t("valid.passwordMin"),
        passwordLetter: t("valid.passwordLetter"),
        passwordNumber: t("valid.passwordNumber"),
        phoneInvalid: t("valid.phoneInvalid"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const loggedUser = await login(values.email, values.password);
      const redirectPath = getRoleRedirectPath(loggedUser?.role);
      router.replace(redirectPath);
    } catch (error) {
      setServerError(extractApiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.signinTitle")}</CardTitle>
        <CardDescription>{t("auth.signinSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              aria-invalid={errors.email ? "true" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? "true" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t("auth.signingIn") : t("auth.signinSubmit")}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          {t("auth.orDivider")}
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleLoginButton />
      </CardContent>
    </Card>
  );
}
