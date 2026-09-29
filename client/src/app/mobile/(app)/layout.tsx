import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TopbarTitle } from "@/components/app/nav";
import { primaryBtn } from "@/components/app/ui";
import { MobileTabBar } from "@/components/mobile/nav";
import { requireUser } from "@/lib/auth";
import { getShellMe } from "@/lib/queries";

// Mobile app shell (design "InicioMovil"): no header, a rounded panel with 8 px of shell around it,
// and the tab bar as the panel's lower edge.
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

      {/* Same rule as the tab bar: on phones with a home indicator the panel goes edge to edge. */}
      <main className="mx-[max(0px,calc(8px-env(safe-area-inset-bottom)*100))] flex min-w-0 grow flex-col gap-5 rounded-t-[20px] border border-b-0 border-rule bg-panel px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))]">
        <TopbarTitle name={firstName} greeting={false} />
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
