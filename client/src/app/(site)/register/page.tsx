import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell, Notice, TextLink, inputClass, labelClass, primaryButton } from "@/components/site/auth";
import { signup } from "@/lib/auth-actions";
import { authNotice } from "@/lib/auth-codes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("meta") };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await authNotice(await searchParams);
  const t = await getTranslations("auth");

  return (
    <AuthShell
      kicker={t("register.kicker")}
      title={t("register.title")}
      tagline={t("register.tagline")}
      intro={<>{t("register.hasAccount")} <TextLink href="/login">{t("register.login")}</TextLink></>}
    >
      {error && <Notice kind="error">{error}</Notice>}
      <form action={signup} className="flex flex-col gap-5">
        <label className={labelClass}>
          {t("fields.email")}
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("fields.password")}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-describedby="pw-hint"
            className={inputClass}
          />
          <span id="pw-hint" className="text-[13px] font-normal text-ink-muted">{t("fields.passwordHint")}</span>
        </label>
        <div className="flex items-start gap-3 text-sm leading-normal text-ink-muted">
          <input id="terms" type="checkbox" name="terms" required className="size-5 shrink-0 accent-leaf" />
          <label htmlFor="terms">
            {t.rich("register.terms", {
              terms: (chunks) => <Link href="/terms" className="text-ink underline">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy" className="text-ink underline">{chunks}</Link>,
            })}
          </label>
        </div>
        <button className={primaryButton}>{t("register.submit")}</button>
      </form>
    </AuthShell>
  );
}
