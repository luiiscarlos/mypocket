import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Bell, CreditCard, Download, LifeBuoy, SlidersHorizontal, Trash2, UserRound, type LucideIcon } from "lucide-react";
import { setView } from "@/app/mobile/actions";
import { changePassword, deleteMyAccount, setNotifications, setPlan, updateProfile } from "@/app/dashboard/actions";
import { FLAGS } from "@/components/app/flags";
import { Modal } from "@/components/app/modal";
import { PageHeader, PageNotice, Section, dangerBtn, pick, primaryBtn, secondaryBtn } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";
import { setLocale, setTheme } from "@/i18n/actions";
import { locales } from "@/i18n/config";
import { getSettingsMe } from "@/lib/queries";
import { logout } from "@/lib/auth-actions";
import { appNotice } from "@/lib/auth-codes";
import { getTheme } from "@/lib/preferences";

type Field = "displayName" | "fullName" | "phone" | "addressLine" | "postalCode" | "city" | "country" | "birthDate" | "currency";

const TABS: { key: "profile" | "preferences" | "plan" | "help"; Icon: LucideIcon }[] = [
  { key: "profile", Icon: UserRound },
  { key: "preferences", Icon: SlidersHorizontal },
  { key: "plan", Icon: CreditCard },
  { key: "help", Icon: LifeBuoy },
];
const TAB_KEYS = TABS.map((x) => x.key);
const segment = "grid border border-ink";
const segmentButton = "flex h-11 cursor-pointer items-center justify-center gap-2 border-0 bg-transparent px-3 font-sans text-sm text-ink aria-pressed:bg-leaf aria-pressed:font-semibold aria-pressed:text-on-leaf";

export async function SettingsScreen({ base, searchParams }: { base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const PAGE = `${base}/settings`;

  const sp = await searchParams;
  const tab = pick(sp.tab, TAB_KEYS) ?? "profile";
  const back = `${PAGE}?tab=${tab}`;
  const [t, locale, theme, notice, { me }] = await Promise.all([
    getTranslations("app.settings"),
    getLocale(),
    getTheme(),
    appNotice(sp as { error?: string; message?: string }),
    getSettingsMe().then((me) => ({ me })),
  ]);
  const hiddenBack = <input type="hidden" name="back" value={back} />;
  const field = (name: Field, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={labelClass}>
      {t(`profile.${name}`)}
      <input name={name} defaultValue={me[name] ?? ""} disabled={me.readOnly} className={inputClass} {...props} />
    </label>
  );

  return (
    <>
      <PageHeader title={t("title")} meta={me.email ?? undefined} />
      <PageNotice {...notice} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        {/* Section list: links (?tab=) so each section has its own URL and works without JS. */}
        <nav aria-label={t("sections")} className="lg:sticky lg:top-24 lg:self-start">
          <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0 lg:flex-col">
            {TABS.map(({ key, Icon }) => (
              <li key={key}>
                <Link
                  href={`${PAGE}?tab=${key}`}
                  aria-current={tab === key ? "page" : undefined}
                  className="group flex h-11 shrink-0 items-center gap-3 whitespace-nowrap px-3 text-[15px] text-ink-muted hover:bg-active hover:text-ink hover:no-underline aria-[current=page]:bg-active aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                >
                  <Icon size={18} aria-hidden className="group-aria-[current=page]:text-leaf" />
                  {t(`tabs.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          {tab === "profile" && (
            <>
              <Section title={t("profile.title")}>
                <form action={updateProfile} className="flex flex-col gap-6">
                  {hiddenBack}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {field("fullName", { maxLength: 100, autoComplete: "name" })}
                    {field("displayName", { maxLength: 50 })}
                    {field("phone", { type: "tel", maxLength: 30, autoComplete: "tel" })}
                    {field("birthDate", { type: "date", className: `${inputClass} font-mono` })}
                    {field("addressLine", { maxLength: 200, autoComplete: "street-address" })}
                    {field("postalCode", { maxLength: 12, autoComplete: "postal-code" })}
                    {field("city", { maxLength: 100, autoComplete: "address-level2" })}
                    {field("country", { maxLength: 2, pattern: "[A-Za-z]{2}", placeholder: "ES", className: `${inputClass} font-mono uppercase` })}
                    {field("currency", { maxLength: 3, pattern: "[A-Za-z]{3}", required: true, className: `${inputClass} font-mono uppercase` })}
                  </div>
                  {!me.readOnly && <button className={`${primaryBtn} self-start`}>{t("profile.save")}</button>}
                </form>
              </Section>

              {!me.readOnly && (
                <Section title={t("password.title")}>
                  <form action={changePassword} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
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
                    <button className={`${secondaryBtn} self-start`}>{t("password.submit")}</button>
                  </form>
                </Section>
              )}

              <Section title={t("data.title")}>
                <p className="m-0 text-[15px] text-ink-muted">{t("data.exportHint")}</p>
                <a href={`${PAGE}/export`} download className={`${secondaryBtn} self-start`}><Download size={16} aria-hidden />{t("data.export")}</a>
                {!me.readOnly && (
                  <div className="flex flex-col gap-3 border-t border-rule pt-6">
                    <p className="m-0 text-[15px] text-ink-muted">{t("delete.warning")}</p>
                    <Modal
                      title={t("delete.title")}
                      trigger={<><Trash2 size={16} aria-hidden />{t("delete.submit")}</>}
                      triggerClassName={`${dangerBtn} self-start`}
                      closeLabel={t("close")}
                    >
                      <form action={deleteMyAccount} className="flex flex-col gap-5">
                        {hiddenBack}
                        <p role="alert" className="m-0 border border-danger bg-danger-bg px-4 py-3 text-[15px] text-danger-ink">{t("delete.warning")}</p>
                        <label className={labelClass}>
                          {t("delete.confirm", { word: t("delete.word") })}
                          <input name="confirm" required autoComplete="off" placeholder={t("delete.word")} className={inputClass} />
                        </label>
                        <button className={`${dangerBtn} self-start`}>{t("delete.submit")}</button>
                      </form>
                    </Modal>
                  </div>
                )}
              </Section>
            </>
          )}

          {tab === "preferences" && (
            <Section title={t("preferences.title")}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
                  <span className="text-base font-semibold">{t("preferences.language")}</span>
                  <form action={setLocale} className={`${segment} grid-cols-2`}>
                    {locales.map((l) => {
                      const F = FLAGS[l];
                      return (
                        <button key={l} name="locale" value={l} aria-pressed={l === locale} className={segmentButton}>
                          <F className="h-3.5 w-5" />
                          {t(`preferences.locales.${l}`)}
                        </button>
                      );
                    })}
                  </form>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
                  <span className="text-base font-semibold">{t("preferences.appearance")}</span>
                  <form action={setTheme} className={`${segment} grid-cols-3`}>
                    {(["light", "dark", "system"] as const).map((th) => (
                      <button key={th} name="theme" value={th} aria-pressed={th === theme} className={segmentButton}>{t(`preferences.themes.${th}`)}</button>
                    ))}
                  </form>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="flex items-start gap-3">
                    <Bell size={18} aria-hidden className="mt-0.5 text-ink-muted" />
                    <span className="flex flex-col">
                      <span className="text-base font-semibold">{t("preferences.notifications")}</span>
                      <span className="text-[13px] text-ink-muted">{t("preferences.notificationsHint")}</span>
                    </span>
                  </span>
                  {!me.readOnly && (
                    <form action={setNotifications}>
                      {hiddenBack}
                      <input type="hidden" name="enabled" value={String(!me.notificationsEnabled)} />
                      <button role="switch" aria-checked={me.notificationsEnabled} aria-label={t("preferences.notifications")} className="relative h-7 w-[52px] cursor-pointer rounded-full border border-control bg-transparent p-0 after:absolute after:left-[3px] after:top-[3px] after:size-5 after:rounded-full after:bg-ink-muted after:transition-transform aria-checked:border-leaf aria-checked:bg-leaf aria-checked:after:translate-x-6 aria-checked:after:bg-on-leaf" />
                    </form>
                  )}
                </div>
              </div>
            </Section>
          )}

          {tab === "plan" && (
            <Section title={t("plan.title")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(["FREE", "PRO"] as const).map((plan) => (
                  <div key={plan} className={`flex flex-col gap-3 p-6 ${me.plan === plan ? "border-[3px] border-leaf" : "border border-ink"}`}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-2xl font-extrabold tracking-[-0.03em]">{t(`plan.${plan}`)}</span>
                      <span className="font-mono text-lg">{t(`plan.price.${plan}`)}</span>
                    </div>
                    <p className="m-0 grow text-[15px] text-ink-muted">{t(`plan.text.${plan}`)}</p>
                    {me.plan === plan ? (
                      <span className="font-mono text-xs tracking-[0.06em] text-leaf">{t("plan.currentTag")}</span>
                    ) : (
                      !me.readOnly && (
                        <form action={setPlan}>
                          {hiddenBack}
                          <input type="hidden" name="plan" value={plan} />
                          <button className={plan === "PRO" ? primaryBtn : secondaryBtn}>{plan === "PRO" ? t("plan.toPro") : t("plan.toFree")}</button>
                        </form>
                      )
                    )}
                  </div>
                ))}
              </div>
              <p className="m-0 text-[13px] text-ink-muted">{t("plan.noPayments")}</p>
              <Link href="/pricing" className="text-sm underline">{t("plan.compare")}</Link>
            </Section>
          )}

          {tab === "help" && (
            <Section title={t("help.title")}>
              <ul className="m-0 flex list-none flex-col p-0 text-base">
                {([[`${base}/support`, "support"], ["/contact", "contact"], ["/faq", "faq"], [`${base}/updates`, "updates"], ["/privacy", "privacy"], ["/terms", "terms"]] as const).map(([href, key]) => (
                  <li key={href} className="border-b border-rule py-3">
                    <Link href={href} className="underline">{t(`help.${key}`)}</Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {/* Switch app: remembered in the "view" cookie so the proxy stops choosing by device. */}
                <form action={setView}>
                  <input type="hidden" name="view" value={base === "/mobile" ? "desktop" : "mobile"} />
                  <button className={secondaryBtn}>{base === "/mobile" ? t("help.desktopView") : t("help.mobileView")}</button>
                </form>
                <form action={logout}>
                  <button className={secondaryBtn}>{t("logout")}</button>
                </form>
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
