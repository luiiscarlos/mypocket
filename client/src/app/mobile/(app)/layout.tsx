import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountMenu } from "@/components/app/account-menu";
import { TopbarTitle } from "@/components/app/nav";
import { primaryBtn } from "@/components/app/ui";
import { MobileTabBar } from "@/components/mobile/nav";
import { requireUser } from "@/lib/auth";
import { getShellMe } from "@/lib/queries";

// Mobile app shell (design "InicioMovil"): 60 px header on the `side` surface with the logo and the
// avatar menu, a rounded panel with 8 px of shell around it, and the tab bar as the panel's lower edge.
export default async function MobileLayout({ children }: LayoutProps<"/mobile">) {
  await requireUser();
  const [me, t] = await Promise.all([getShellMe(), getTranslations("app")]);
  // One onboarding for both apps; it adapts to the phone.
  if (!me.onboardingCompleted) redirect("/dashboard/onboarding");
  const firstName = me.readOnly ? "" : (me.displayName ?? me.fullName?.split(" ")[0] ?? "");

  return (
    <div className="flex min-h-dvh flex-col bg-side text-ink">
      {/* Behind the iOS status bar / notch (0 px tall elsewhere): a solid strip so the white status text stays readable. */}
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-statusbar" />
      <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between bg-side px-4 pt-[env(safe-area-inset-top)] pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] box-content">
        <Link href="/mobile" className="flex items-center gap-2 text-[19px] font-bold tracking-[-0.03em] text-ink hover:no-underline">
          <span aria-hidden="true" className="block size-7 rounded-[9px] bg-leaf" />
          mypocket
        </Link>
        <AccountMenu me={me} base="/mobile" withLanguage size={36} />
      </header>

      {/* Same rule as the tab bar: on phones with a home indicator the panel goes edge to edge. */}
      <main className="mx-[max(0px,calc(8px-env(safe-area-inset-bottom)*100))] flex min-w-0 grow flex-col gap-5 rounded-t-[20px] border border-b-0 border-rule bg-panel px-4 pt-5 pb-[calc(112px+env(safe-area-inset-bottom))]">
        <TopbarTitle name={firstName} />
        {me.readOnly && (
          <div role="status" className="flex flex-col gap-3 rounded-card border border-info bg-info-bg p-4 text-[15px] text-info-ink">
            <span><strong>{t("demo.title")}</strong> {t("demo.text")}</span>
            <Link href="/register" className={`${primaryBtn} h-11 self-start`}>{t("demo.cta")}</Link>
          </div>
        )}
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
