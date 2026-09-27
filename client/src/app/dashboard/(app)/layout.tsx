import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronDown, LifeBuoy, LogOut, Megaphone, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Plus, Settings, ShieldCheck, Sun, UserRound } from "lucide-react";
import { toggleSidebar } from "@/app/dashboard/actions";
import { FLAGS } from "@/components/app/flags";
import { BottomNav, SideNav } from "@/components/app/nav";
import { primaryBtn } from "@/components/app/ui";
import { setLocale, setTheme } from "@/i18n/actions";
import { locales } from "@/i18n/config";
import { gql } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { getSidebarCollapsed, getTheme } from "@/lib/preferences";

type Me = {
  email: string | null; displayName: string | null; fullName: string | null; readOnly: boolean; onboardingCompleted: boolean;
  plan: "FREE" | "PRO"; isAdmin: boolean;
};

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const menuItem = "flex h-11 w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 font-sans text-[15px] text-ink hover:bg-active hover:no-underline";
const summaryReset = "list-none [&::-webkit-details-marker]:hidden";

function initials(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser();
  const [{ me }, t, locale, theme, collapsed] = await Promise.all([
    gql<{ me: Me }>("{ me { email displayName fullName readOnly onboardingCompleted plan isAdmin } }"),
    getTranslations("app"),
    getLocale(),
    getTheme(),
    getSidebarCollapsed(),
  ]);
  // The first-run onboarding is mandatory before the app.
  if (!me.onboardingCompleted) redirect("/dashboard/onboarding");

  const name = me.readOnly ? t("demo.user") : (me.displayName ?? me.fullName ?? me.email ?? "");
  const tag = me.readOnly ? "DEMO" : t(`plans.${me.plan}`).toUpperCase();
  const Flag = FLAGS[locale as keyof typeof FLAGS] ?? FLAGS.es;

  return (
    // Sidebar and header share the `side` surface with no line between them; content sits on `paper`.
    <div className="flex min-h-screen bg-side text-ink">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col py-5 lg:flex ${collapsed ? "w-[72px] px-3" : "w-[256px] px-5"}`}>
        <Link href="/dashboard" aria-label="mypocket" className={`flex h-12 items-center text-[22px] font-extrabold tracking-[-0.04em] text-ink hover:no-underline ${collapsed ? "justify-center" : "px-3"}`}>
          {collapsed ? <>m<span className="text-leaf">.</span></> : <>mypocket<span className="text-leaf">.</span></>}
        </Link>
        {!me.readOnly && (
          <Link
            href="/dashboard/transactions?new=1"
            title={collapsed ? t("nav.newTransaction") : undefined}
            aria-label={collapsed ? t("nav.newTransaction") : undefined}
            className={`${primaryBtn} mb-6 mt-5 ${collapsed ? "px-0" : ""}`}
          >
            <Plus size={18} strokeWidth={2.2} aria-hidden />
            {!collapsed && t("nav.newTransaction")}
          </Link>
        )}
        <SideNav collapsed={collapsed} />
        <form action={toggleSidebar} className="mt-auto pt-4">
          <input type="hidden" name="collapse" value={String(!collapsed)} />
          <button
            aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
            aria-expanded={!collapsed}
            title={collapsed ? t("nav.expand") : t("nav.collapse")}
            className={`flex h-11 w-full cursor-pointer items-center gap-3 border-0 bg-transparent font-sans text-sm text-ink-muted hover:bg-active hover:text-ink ${collapsed ? "justify-center" : "px-3"}`}
          >
            {collapsed ? <PanelLeftOpen size={20} aria-hidden /> : <PanelLeftClose size={20} aria-hidden />}
            {!collapsed && t("nav.collapse")}
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 grow flex-col">
        <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between gap-3 bg-side px-5 lg:px-10">
          <Link href="/dashboard" className="text-xl font-extrabold tracking-[-0.04em] text-ink hover:no-underline lg:invisible">
            mypocket<span className="text-leaf">.</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Language: flag + code; the list shows every language with its flag. */}
            <details className="relative">
              <summary className={`${summaryReset} flex h-11 cursor-pointer items-center gap-2 border border-transparent px-3 text-sm font-semibold uppercase hover:border-ink`} aria-label={t("header.language")}>
                <Flag className="h-3.5 w-5" />
                {locale}
                <ChevronDown size={14} aria-hidden />
              </summary>
              <form action={setLocale} className="absolute right-0 top-12 z-20 flex w-48 flex-col border border-ink bg-field py-1">
                {locales.map((l) => {
                  const F = FLAGS[l];
                  return (
                    <button key={l} name="locale" value={l} aria-pressed={l === locale} className={`${menuItem} aria-pressed:font-semibold`}>
                      <F className="h-3.5 w-5" />
                      {t(`settings.preferences.locales.${l}`)}
                    </button>
                  );
                })}
              </form>
            </details>

            <details className="relative">
              <summary className={`${summaryReset} flex size-11 cursor-pointer items-center justify-center bg-leaf font-mono text-sm font-medium text-on-leaf`} aria-label={t("header.account")} title={name}>
                {me.readOnly ? "D" : initials(name)}
              </summary>
              <div className="absolute right-0 top-12 z-20 flex w-72 flex-col border border-ink bg-field">
                <div className="flex flex-col gap-0.5 border-b border-rule p-4">
                  <span className="truncate text-[15px] font-semibold">{name}</span>
                  <span className="truncate text-[13px] text-ink-muted">{me.readOnly ? t("demo.readOnly") : me.email}</span>
                  <span className="mt-2 self-start border border-rule px-2 py-0.5 font-mono text-[11px] tracking-[0.06em] text-ink-muted">{tag}</span>
                </div>
                <nav aria-label={t("header.account")} className="flex flex-col py-1">
                  <Link href="/dashboard/settings?tab=profile" className={menuItem}><UserRound size={18} aria-hidden />{t("header.profile")}</Link>
                  <Link href="/dashboard/settings" className={menuItem}><Settings size={18} aria-hidden />{t("nav.settings")}</Link>
                  <Link href="/dashboard/updates" className={menuItem}><Megaphone size={18} aria-hidden />{t("nav.updates")}</Link>
                  <Link href="/dashboard/support" className={menuItem}><LifeBuoy size={18} aria-hidden />{t("header.support")}</Link>
                  {me.isAdmin && <Link href="/dashboard/support/admin" className={menuItem}><ShieldCheck size={18} aria-hidden />{t("header.admin")}</Link>}
                </nav>
                <div className="flex flex-col gap-2 border-t border-rule p-4">
                  <span className="font-mono text-[11px] tracking-[0.06em] text-ink-muted">{t("header.appearance")}</span>
                  <form action={setTheme} className="grid grid-cols-3 border border-ink">
                    {(["light", "dark", "system"] as const).map((th) => {
                      const Icon = THEME_ICONS[th];
                      return (
                        <button key={th} name="theme" value={th} aria-pressed={th === theme} className="flex h-10 cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent font-sans text-xs text-ink aria-pressed:bg-leaf aria-pressed:font-semibold aria-pressed:text-on-leaf">
                          <Icon size={14} aria-hidden />
                          {t(`header.themes.${th}`)}
                        </button>
                      );
                    })}
                  </form>
                </div>
                <form action={logout} className="border-t border-rule py-1">
                  <button className={menuItem}><LogOut size={18} aria-hidden />{t("nav.logout")}</button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main className="flex min-w-0 grow flex-col gap-8 bg-paper px-5 pb-28 sm:px-10 lg:px-16 lg:pb-16 xl:px-24">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
            {me.readOnly && (
              <div role="status" className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-info bg-info-bg px-5 py-4 text-[15px] text-info-ink">
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
