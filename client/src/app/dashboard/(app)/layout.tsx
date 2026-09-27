import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LogOut, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Plus, Settings, SlidersHorizontal, Sun } from "lucide-react";
import { toggleSidebar } from "@/app/dashboard/actions";
import { BottomNav, SideNav } from "@/components/app/nav";
import { primaryBtn } from "@/components/app/ui";
import { setLocale, setTheme } from "@/i18n/actions";
import { locales } from "@/i18n/config";
import { gql } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { getSidebarCollapsed, getTheme } from "@/lib/preferences";

type Me = { email: string | null; displayName: string | null; fullName: string | null; readOnly: boolean; onboardingCompleted: boolean; plan: "FREE" | "PRO" };

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const iconButton = "inline-flex size-11 cursor-pointer items-center justify-center border border-transparent bg-transparent text-ink hover:border-ink hover:no-underline";

function initials(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser();
  const [{ me }, t, locale, theme, collapsed] = await Promise.all([
    gql<{ me: Me }>("{ me { email displayName fullName readOnly onboardingCompleted plan } }"),
    getTranslations("app"),
    getLocale(),
    getTheme(),
    getSidebarCollapsed(),
  ]);
  // The first-run onboarding is mandatory before the app.
  if (!me.onboardingCompleted) redirect("/dashboard/onboarding");

  const name = me.readOnly ? t("demo.user") : (me.displayName ?? me.fullName ?? me.email ?? "");
  const tag = me.readOnly ? "DEMO" : t(`plans.${me.plan}`).toUpperCase();

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-rule bg-paper py-5 lg:flex ${collapsed ? "w-[72px] px-3" : "w-[260px] px-5"}`}
      >
        <Link href="/dashboard" aria-label="mypocket" className={`flex h-12 items-center text-[22px] font-extrabold tracking-[-0.04em] text-ink hover:no-underline ${collapsed ? "justify-center" : "px-3"}`}>
          {collapsed ? <span className="text-leaf">m.</span> : <>mypocket<span className="text-leaf">.</span></>}
        </Link>
        {!me.readOnly && (
          <Link
            href="/dashboard/transactions#new"
            title={collapsed ? t("nav.newTransaction") : undefined}
            aria-label={collapsed ? t("nav.newTransaction") : undefined}
            className={`${primaryBtn} mb-6 mt-5 ${collapsed ? "px-0" : ""}`}
          >
            <Plus size={18} strokeWidth={2.2} aria-hidden />
            {!collapsed && t("nav.newTransaction")}
          </Link>
        )}
        <SideNav collapsed={collapsed} />
        <form action={toggleSidebar} className="mt-auto border-t border-rule pt-4">
          <input type="hidden" name="collapse" value={String(!collapsed)} />
          <button
            aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
            title={collapsed ? t("nav.expand") : t("nav.collapse")}
            className={`flex h-11 w-full cursor-pointer items-center gap-3 border-0 bg-transparent font-sans text-sm text-ink-muted hover:text-ink ${collapsed ? "justify-center" : "px-3"}`}
          >
            {collapsed ? <PanelLeftOpen size={20} aria-hidden /> : <PanelLeftClose size={20} aria-hidden />}
            {!collapsed && t("nav.collapse")}
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 grow flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-rule bg-paper px-5 lg:px-14">
          <Link href="/dashboard" className="text-xl font-extrabold tracking-[-0.04em] text-ink hover:no-underline lg:invisible">
            mypocket<span className="text-leaf">.</span>
          </Link>
          <div className="flex items-center gap-1">
            <details className="relative">
              <summary className={`${iconButton} list-none [&::-webkit-details-marker]:hidden`} aria-label={t("header.preferences")} title={t("header.preferences")}>
                <SlidersHorizontal size={20} aria-hidden />
              </summary>
              <div className="absolute right-0 top-12 z-20 flex w-64 flex-col gap-4 border border-ink bg-paper p-4">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] tracking-[0.06em] text-ink-muted">{t("header.language")}</span>
                  <form action={setLocale} className="grid grid-cols-2 border border-ink">
                    {locales.map((l) => (
                      <button key={l} name="locale" value={l} aria-pressed={l === locale} className="h-10 cursor-pointer border-0 bg-transparent font-sans text-sm text-ink aria-pressed:bg-leaf aria-pressed:font-semibold aria-pressed:text-on-leaf">
                        {t(`settings.preferences.locales.${l}`)}
                      </button>
                    ))}
                  </form>
                </div>
                <div className="flex flex-col gap-2">
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
              </div>
            </details>
            <Link href="/dashboard/settings" className={iconButton} aria-label={t("nav.settings")} title={t("nav.settings")}>
              <Settings size={20} aria-hidden />
            </Link>
            <details className="relative">
              <summary
                className="ml-1 flex size-11 cursor-pointer list-none items-center justify-center bg-leaf font-mono text-sm font-medium text-on-leaf [&::-webkit-details-marker]:hidden"
                aria-label={t("header.account")}
                title={name}
              >
                {me.readOnly ? "D" : initials(name)}
              </summary>
              <div className="absolute right-0 top-12 z-20 flex w-64 flex-col border border-ink bg-paper">
                <div className="flex flex-col gap-0.5 border-b border-rule p-4">
                  <span className="truncate text-[15px] font-semibold">{name}</span>
                  <span className="truncate text-[13px] text-ink-muted">{me.readOnly ? t("demo.readOnly") : me.email}</span>
                  <span className="mt-2 self-start border border-rule px-2 py-0.5 font-mono text-[11px] tracking-[0.06em] text-ink-muted">{tag}</span>
                </div>
                <Link href="/dashboard/profile" className="flex h-11 items-center px-4 text-[15px] text-ink hover:bg-band hover:no-underline">{t("header.profile")}</Link>
                <Link href="/dashboard/settings" className="flex h-11 items-center px-4 text-[15px] text-ink hover:bg-band hover:no-underline">{t("nav.settings")}</Link>
                <form action={logout} className="border-t border-rule">
                  <button className="flex h-11 w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 font-sans text-[15px] text-ink hover:bg-band">
                    <LogOut size={16} aria-hidden />
                    {t("nav.logout")}
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main className="flex min-w-0 grow flex-col gap-8 px-5 pb-28 lg:px-14 lg:pb-12">
          {me.readOnly && (
            <div role="status" className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-leaf bg-ok-bg px-5 py-4 text-[15px]">
              <span><strong>{t("demo.title")}</strong> {t("demo.text")}</span>
              <Link href="/register" className={`${primaryBtn} h-11`}>{t("demo.cta")}</Link>
            </div>
          )}
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
