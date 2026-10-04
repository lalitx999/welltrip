"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

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
import { createRegisterSchema, type RegisterInput } from "@/schemas/auth";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerAccount } = useAuth();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);

  // Rebuild schema when the language changes so validation messages match
  // the active UI locale.
  const registerSchema = useMemo(
    () =>
      createRegisterSchema({
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
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        first_name: values.first_name ?? "",
        last_name: values.last_name ?? "",
        phone_number: values.phone_number ?? "",
      });
      // Backend register does not return tokens (spec §4) -> send the user
      // to the login page to authenticate.
      router.push("/login?registered=1");
    } catch (error) {
      setServerError(extractApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-xs font-semibold text-[#193e30]">
              {t("auth.firstNameLabel")}
            </Label>
            <Input
              id="first_name"
              autoComplete="given-name"
              className="rounded-xl border-[#d8ddce] focus-visible:ring-[#224e39]"
              {...register("first_name")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-xs font-semibold text-[#193e30]">
              {t("auth.lastNameLabel")}
            </Label>
            <Input
              id="last_name"
              autoComplete="family-name"
              className="rounded-xl border-[#d8ddce] focus-visible:ring-[#224e39]"
              {...register("last_name")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-[#193e30]">
            {t("auth.emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            className="rounded-xl border-[#d8ddce] focus-visible:ring-[#224e39]"
            aria-invalid={errors.email ? "true" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone_number" className="text-xs font-semibold text-[#193e30]">
            {t("auth.phoneLabel")}
          </Label>
          <Input
            id="phone_number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={t("auth.phonePlaceholder")}
            className="rounded-xl border-[#d8ddce] focus-visible:ring-[#224e39]"
            aria-invalid={errors.phone_number ? "true" : undefined}
            {...register("phone_number")}
          />
          {errors.phone_number && (
            <p className="text-xs text-destructive">
              {errors.phone_number.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-[#193e30]">
            {t("auth.passwordLabel")}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="rounded-xl border-[#d8ddce] focus-visible:ring-[#224e39]"
            aria-invalid={errors.password ? "true" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full rounded-xl bg-[#224e39] py-3 text-sm font-semibold text-white hover:bg-[#173a29] transition"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? t("auth.creating") : t("auth.createSubmit")}
        </Button>
      </form>
    </div>
  );
}
