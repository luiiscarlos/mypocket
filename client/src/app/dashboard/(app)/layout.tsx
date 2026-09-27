import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NavLinks } from "@/components/app/nav";
import { Logo } from "@/components/site/chrome";
import { gql } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";

type Me = { email: string | null; displayName: string | null; fullName: string | null; readOnly: boolean; onboardingCompleted: boolean; plan: string };

export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser();
  const [{ me }, t] = await Promise.all([
    gql<{ me: Me }>("{ me { email displayName fullName readOnly onboardingCompleted plan } }"),
    getTranslations("app"),
  ]);
  // The first-run onboarding is mandatory before the app.
  if (!me.onboardingCompleted) redirect("/dashboard/onboarding");

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-brand px-5 pb-2 pt-5 text-cream lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:gap-10 lg:px-6 lg:py-8">
        <div className="flex items-center justify-between lg:flex-col lg:items-start lg:gap-2">
          <Logo />
          <div className="font-mono text-xs text-mist">
            {me.displayName ?? me.fullName ?? me.email} · {t(`plans.${me.plan}` as "plans.FREE")}
          </div>
        </div>
        <NavLinks />
        <form action={logout} className="hidden lg:mt-auto lg:block">
          <button className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm text-mist underline hover:text-cream">{t("nav.logout")}</button>
        </form>
      </aside>
      <main className="flex min-w-0 grow flex-col gap-10 px-5 py-8 lg:px-16 lg:py-12">
        {me.readOnly && (
          <div role="status" className="border border-dash bg-band px-4 py-3 text-[15px]">{t("demoBanner")}</div>
        )}
        {children}
      </main>
    </div>
  );
}
