import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/site/auth";
import { Input, Label, Notice, inputClass, labelClass, primaryButton } from "@/components/forms";
import { requestPasswordReset } from "@/lib/auth-actions";
import { authNotice } from "@/lib/auth-codes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgot");
  return { title: t("meta") };
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await authNotice(await searchParams);
  const t = await getTranslations("auth");

  return (
    <AuthShell kicker={t("forgot.kicker")} title={t("forgot.title")} intro={t("forgot.intro")} tagline={t("forgot.tagline")}>
      {message && <Notice kind="status">{message}</Notice>}
      <form action={requestPasswordReset} className="flex flex-col gap-5">
        <Label className={labelClass}>
          {t("fields.email")}
          <Input name="email" type="email" autoComplete="email" required className={inputClass} />
        </Label>
        <button className={primaryButton}>{t("forgot.submit")}</button>
      </form>
      <Link href="/login" className="text-[15px] font-semibold underline">
        {t("forgot.back")}
      </Link>
    </AuthShell>
  );
}
