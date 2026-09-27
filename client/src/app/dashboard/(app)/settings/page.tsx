import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { changePassword, deleteMyAccount, setNotifications, setPlan } from "@/app/dashboard/actions";
import { PageHeader, PageNotice, Section, smallButton } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";
import { ThemeSwitcher } from "@/components/site/chrome";
import { setLocale } from "@/i18n/actions";
import { locales } from "@/i18n/config";
import { gql } from "@/lib/api";
import { logout } from "@/lib/auth-actions";
import { appNotice } from "@/lib/auth-codes";
import { getTheme } from "@/lib/preferences";

type Me = { email: string | null; plan: "FREE" | "PRO"; notificationsEnabled: boolean; readOnly: boolean };

const PAGE = "/dashboard/settings";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("settings") };
}

export default async function SettingsPage({ searchParams }: PageProps<"/dashboard/settings">) {
  const [t, locale, theme, notice, { me }] = await Promise.all([
    getTranslations("app.settings"),
    getLocale(),
    getTheme(),
    appNotice(await searchParams),
    gql<{ me: Me }>("{ me { email plan notificationsEnabled readOnly } }"),
  ]);
  const hiddenBack = <input type="hidden" name="back" value={PAGE} />;

  return (
    <>
      <PageHeader title={t("title")} />
      <PageNotice {...notice} />

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        <Section title={t("preferences.title")}>
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4 border-b border-rule pb-4">
              <span className="text-base">{t("preferences.language")}</span>
              <form action={setLocale} className="flex gap-2">
                {locales.map((l) => (
                  <button key={l} name="locale" value={l} aria-pressed={l === locale} className={`${smallButton} aria-pressed:bg-ink aria-pressed:text-paper`}>
                    {t(`preferences.locales.${l}`)}
                  </button>
                ))}
              </form>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-rule pb-4">
              <span className="text-base">{t("preferences.appearance")}</span>
              <ThemeSwitcher current={theme} className="text-ink" />
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-rule pb-4">
              <span className="flex flex-col">
                <span className="text-base">{t("preferences.notifications")}</span>
                <span className="text-[13px] text-ink-muted">{t("preferences.notificationsHint")}</span>
              </span>
              <form action={setNotifications}>
                {hiddenBack}
                <input type="hidden" name="enabled" value={String(!me.notificationsEnabled)} />
                {!me.readOnly && <button role="switch" aria-checked={me.notificationsEnabled} className={`${smallButton} aria-checked:bg-ink aria-checked:text-paper`}>
                  {me.notificationsEnabled ? t("preferences.on") : t("preferences.off")}
                </button>}
              </form>
            </div>
          </div>
        </Section>

        <Section title={t("plan.title")}>
          <p className="m-0 text-[15px] text-ink-muted">{t("plan.current", { plan: t(`plan.${me.plan}`) })}</p>
          <p className="m-0 text-[13px] text-ink-muted">{t("plan.noPayments")}</p>
          <form action={setPlan}>
            {hiddenBack}
            <input type="hidden" name="plan" value={me.plan === "PRO" ? "FREE" : "PRO"} />
            {!me.readOnly && <button className={smallButton}>{me.plan === "PRO" ? t("plan.toFree") : t("plan.toPro")}</button>}
          </form>
          <Link href="/pricing" className="text-sm underline">{t("plan.compare")}</Link>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        <Section title={t("password.title")}>
          <form action={changePassword} className="flex flex-col gap-4">
            {hiddenBack}
            <label className={labelClass}>
              {t("password.current")}
              <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
            </label>
            <label className={labelClass}>
              {t("password.new")}
              <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
            </label>
            <label className={labelClass}>
              {t("password.confirm")}
              <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
            </label>
            {!me.readOnly && <button className={`${smallButton} self-start`}>{t("password.submit")}</button>}
          </form>
        </Section>

        <Section title={t("help.title")}>
          <ul className="m-0 flex list-none flex-col p-0 text-base">
            {([["/contact", "contact"], ["/faq", "faq"], ["/dashboard/updates", "updates"], ["/privacy", "privacy"], ["/terms", "terms"]] as const).map(([href, key]) => (
              <li key={href} className="border-b border-rule py-3">
                <Link href={href} className="underline">{t(`help.${key}`)}</Link>
              </li>
            ))}
          </ul>
          <form action={logout}>
            <button className={smallButton}>{t("logout")}</button>
          </form>
        </Section>
      </div>

      <Section title={t("data.title")}>
        <p className="m-0 text-[15px] text-ink-muted">{t("data.exportHint")}</p>
        <a href={`${PAGE}/export`} download className={`${smallButton} inline-flex items-center self-start hover:no-underline`}>{t("data.export")}</a>
        <form action={deleteMyAccount} className="flex flex-col gap-4 border border-danger p-5">
          {hiddenBack}
          <p className="m-0 text-[15px]">{t("delete.warning")}</p>
          <label className={labelClass}>
            {t("delete.confirm", { word: t("delete.word") })}
            <input name="confirm" required autoComplete="off" className={`${inputClass} max-w-xs`} />
          </label>
          {!me.readOnly && <button className={`${smallButton} self-start border-danger text-danger`}>{t("delete.submit")}</button>}
        </form>
      </Section>
    </>
  );
}
