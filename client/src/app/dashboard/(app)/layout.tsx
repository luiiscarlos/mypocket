import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Check, ChevronDown, LifeBuoy, LogOut, Megaphone, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Plus, Settings, ShieldCheck, Sun, UserRound } from "lucide-react";
import { toggleSidebar } from "@/app/dashboard/actions";
import { FLAGS } from "@/components/app/flags";
import { BottomNav, SideNav, TopbarTitle } from "@/components/app/nav";
import { primaryBtn } from "@/components/app/ui";
import { setLocale, setTheme } from "@/i18n/actions";
import { locales } from "@/i18n/config";
import { getShellMe } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { getSidebarCollapsed, getTheme } from "@/lib/preferences";

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const menuItem = "flex h-10 w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 bg-transparent px-3 font-sans text-[15px] text-ink hover:bg-band hover:no-underline";
const summaryReset = "list-none [&::-webkit-details-marker]:hidden";
const dropdown = "absolute right-0 top-12 z-30 flex flex-col border border-rule bg-field shadow-float";

function initials(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

// Design v3 shell: menu and top bar share the `side` surface with no line between them; the page sits
// on a rounded `panel` with 12 px of shell showing to the right and below.
export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser();
  const [{ me }, t, locale, theme, collapsed] = await Promise.all([
    getShellMe().then((me) => ({ me })),
    getTranslations("app"),
    getLocale(),
    getTheme(),
    getSidebarCollapsed(),
  ]);
  // The first-run onboarding is mandatory before the app.
  if (!me.onboardingCompleted) redirect("/dashboard/onboarding");

  const name = me.readOnly ? t("demo.user") : (me.displayName ?? me.fullName ?? me.email ?? "");
  const firstName = me.readOnly ? "" : (me.displayName ?? me.fullName?.split(" ")[0] ?? "");
  const planLabel = me.readOnly ? "Demo" : t(`plans.${me.plan}`);
  const Flag = FLAGS[locale as keyof typeof FLAGS] ?? FLAGS.es;

  return (
    <div className="flex min-h-screen bg-side text-ink">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col pb-4 lg:flex ${collapsed ? "w-[72px] px-3" : "w-[248px] px-4"}`}>
        <Link href="/dashboard" aria-label="mypocket" className={`flex h-16 shrink-0 items-center text-[21px] font-bold tracking-[-0.03em] text-ink hover:no-underline ${collapsed ? "justify-center" : "px-3"}`}>
          {collapsed ? <>m<span className="text-leaf">.</span></> : <>mypocket<span className="text-leaf">.</span></>}
        </Link>
        <div className="mt-2"><SideNav collapsed={collapsed} free={me.plan !== "PRO"} /></div>
        <div className="mt-auto flex flex-col gap-2">
          {!me.readOnly && (
            <Link
              href="/dashboard/transactions?new=1"
              title={collapsed ? t("nav.newTransaction") : undefined}
              aria-label={collapsed ? t("nav.newTransaction") : undefined}
              className={`${primaryBtn} h-11 ${collapsed ? "px-0" : ""}`}
            >
              <Plus size={18} strokeWidth={2.2} aria-hidden />
              {!collapsed && t("nav.newTransaction")}
            </Link>
          )}
          <form action={toggleSidebar}>
            <input type="hidden" name="collapse" value={String(!collapsed)} />
            <button
              aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
              aria-expanded={!collapsed}
              title={collapsed ? t("nav.expand") : t("nav.collapse")}
              className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-control border-0 bg-transparent font-sans text-sm text-ink-muted hover:bg-field/60 hover:text-ink ${collapsed ? "justify-center" : "px-3"}`}
            >
              {collapsed ? <PanelLeftOpen size={20} aria-hidden /> : <PanelLeftClose size={20} aria-hidden />}
              {!collapsed && t("nav.collapse")}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 grow flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 bg-side px-4 lg:pl-2 lg:pr-5">
          <TopbarTitle name={firstName} />
          <div className="flex items-center gap-2">
            <details className="relative">
              <summary className={`${summaryReset} flex h-10 cursor-pointer items-center gap-2 rounded-full border border-rule bg-field px-3 text-sm font-semibold uppercase hover:border-control`} aria-label={t("header.language")}>
                <Flag className="h-3.5 w-5 rounded-[3px]" />
                {locale}
                <ChevronDown size={14} aria-hidden />
              </summary>
              <form action={setLocale} className={`${dropdown} w-[200px] rounded-2xl p-1.5`}>
                {locales.map((l) => {
                  const F = FLAGS[l];
                  return (
                    <button key={l} name="locale" value={l} aria-pressed={l === locale} className={`${menuItem} aria-pressed:font-semibold`}>
                      <F className="h-3.5 w-5 rounded-[3px]" />
                      <span className="grow text-left">{t(`settings.preferences.locales.${l}`)}</span>
                      {l === locale && <Check size={16} className="text-leaf" aria-hidden />}
                    </button>
                  );
                })}
              </form>
            </details>

            <details className="relative">
              <summary className={`${summaryReset} flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-leaf text-[13px] font-bold text-on-leaf`} aria-label={t("header.account")} title={name}>
                {me.readOnly ? "D" : initials(name)}
              </summary>
              <div className={`${dropdown} w-[264px] rounded-[18px] p-2`}>
                <div className="flex flex-col gap-0.5 border-b border-rule px-3 pb-3 pt-2">
                  <span className="truncate text-[15px] font-semibold">{name}</span>
                  <span className="truncate text-[13px] text-ink-muted">{me.readOnly ? t("demo.readOnly") : me.email}</span>
                  <span className="mt-2 self-start rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-semibold text-leaf">{planLabel}</span>
                </div>
                <nav aria-label={t("header.account")} className="flex flex-col py-1.5">
                  <Link href="/dashboard/settings?tab=profile" className={menuItem}><UserRound size={18} aria-hidden />{t("header.profile")}</Link>
                  <Link href="/dashboard/settings" className={menuItem}><Settings size={18} aria-hidden />{t("nav.settings")}</Link>
                  <Link href="/dashboard/updates" className={menuItem}><Megaphone size={18} aria-hidden />{t("nav.updates")}</Link>
                  <Link href="/dashboard/support" className={menuItem}><LifeBuoy size={18} aria-hidden />{t("header.support")}</Link>
                  {me.isAdmin && (
                    <Link href="/dashboard/support/admin" className={menuItem}>
                      <ShieldCheck size={18} aria-hidden />
                      <span className="grow">{t("header.tickets")}</span>
                      <span className="rounded-full bg-info-bg px-2 py-0.5 text-[11px] font-semibold text-info-ink">Admin</span>
                    </Link>
                  )}
                </nav>
                <div className="flex items-center justify-between gap-3 border-t border-rule px-3 py-3">
                  <span className="text-[15px]">{t("header.appearance")}</span>
                  <form action={setTheme} className="inline-flex gap-0.5 rounded-full border border-rule p-[3px]">
                    {(["light", "dark", "system"] as const).map((th) => {
                      const Icon = THEME_ICONS[th];
                      return (
                        <button key={th} name="theme" value={th} aria-pressed={th === theme} aria-label={t(`header.themes.${th}`)} title={t(`header.themes.${th}`)} className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink-muted aria-pressed:bg-band aria-pressed:text-ink">
                          <Icon size={14} aria-hidden />
                        </button>
                      );
                    })}
                  </form>
                </div>
                <form action={logout} className="border-t border-rule pt-1.5">
                  <button className={`${menuItem} text-ink-muted`}><LogOut size={18} aria-hidden />{t("nav.logout")}</button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main className="mb-[88px] flex min-w-0 grow flex-col rounded-[20px] border border-rule bg-panel px-5 py-6 lg:mb-3 lg:mr-3 lg:px-10 lg:py-8">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
            {me.readOnly && (
              <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-info bg-info-bg px-5 py-4 text-[15px] text-info-ink">
                <span><strong>{t("demo.title")}</strong> {t("demo.text")}</span>
                <Link href="/register" className={`${primaryBtn} h-11`}>{t("demo.cta")}</Link>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
