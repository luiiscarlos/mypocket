import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { toggleSidebar } from "@/app/dashboard/actions";
import { AccountMenu, LanguagePill } from "@/components/app/account-menu";
import { BottomNav, SideNav, TopbarTitle } from "@/components/app/nav";
import { primaryBtn } from "@/components/app/ui";
import { getShellMe } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { getSidebarCollapsed } from "@/lib/preferences";

// Design v3 shell: menu and top bar share the `side` surface with no line between them; the page sits
// on a rounded `panel` with 12 px of shell showing to the right and below.
export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser();
  const [me, t, collapsed] = await Promise.all([getShellMe(), getTranslations("app"), getSidebarCollapsed()]);
  // The first-run onboarding is mandatory before the app.
  if (!me.onboardingCompleted) redirect("/dashboard/onboarding");

  const firstName = me.readOnly ? "" : (me.displayName ?? me.fullName?.split(" ")[0] ?? "");

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
              className={cn(buttonVariants({ variant: "ghost" }), "h-11 w-full gap-3 rounded-control text-sm font-normal text-ink-muted hover:bg-field/60 hover:text-ink", collapsed ? "justify-center" : "justify-start px-3")}
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
            <LanguagePill />
            <AccountMenu me={me} base="/dashboard" />
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
