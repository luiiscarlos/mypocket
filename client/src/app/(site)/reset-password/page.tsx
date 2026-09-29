import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/site/auth";
import { Input, Label, Notice, inputClass, labelClass, primaryButton } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { updatePassword } from "@/lib/auth-actions";
import { authNotice } from "@/lib/auth-codes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return { title: t("meta") };
}

// Reached from the recovery email via /auth/confirm, which opens a recovery session.
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const { error } = await authNotice(await searchParams);
  const t = await getTranslations("auth");

  return (
    <AuthShell kicker={t("reset.kicker")} title={t("reset.title")} intro={t("reset.intro")} tagline={t("reset.tagline")}>
      {error && <Notice kind="error">{error}</Notice>}
      <form action={updatePassword} className="flex flex-col gap-5">
        <Label className={labelClass}>
          {t("fields.newPassword")}
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </Label>
        <Label className={labelClass}>
          {t("fields.repeatPassword")}
          <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </Label>
        <button className={primaryButton}>{t("reset.submit")}</button>
      </form>
    </AuthShell>
  );
}
