import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/site/auth";
import { Notice, TextLink, inputClass, labelClass, primaryButton } from "@/components/forms";
import { login } from "@/lib/auth-actions";
import { authNotice } from "@/lib/auth-codes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("meta") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const { error, message } = await authNotice(params);
  const t = await getTranslations("auth");

  return (
    <AuthShell
      kicker={t("login.kicker")}
      title={t("login.title")}
      tagline={t("login.tagline")}
      intro={<>{t("login.noAccount")} <TextLink href="/register">{t("login.createAccount")}</TextLink></>}
    >
      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice kind="status">{message}</Notice>}
      <form action={login} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={params.next ?? ""} />
        <label className={labelClass}>
          {t("fields.email")}
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm font-semibold">
            <label htmlFor="password">{t("fields.password")}</label>
            <Link href="/forgot-password" className="font-medium text-ink-muted underline">
              {t("login.forgot")}
            </Link>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </div>
        <button className={primaryButton}>{t("login.submit")}</button>
      </form>
    </AuthShell>
  );
}
