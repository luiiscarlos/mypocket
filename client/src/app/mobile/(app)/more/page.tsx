import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { Calculator, ChartColumn, ChevronRight, LifeBuoy, Megaphone, Monitor, Settings, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { setView } from "@/app/mobile/actions";
import { getShellMe } from "@/lib/queries";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("more") };
}

const item = "flex min-h-[56px] items-center gap-3 border-b border-rule text-[15px] text-ink hover:no-underline";
const icon = "flex size-10 shrink-0 items-center justify-center rounded-control bg-band text-ink-muted";

// "Más": everything that doesn't fit in the tab bar.
export default async function MorePage() {
  const [t, me] = await Promise.all([getTranslations("app"), getShellMe()]);
  const entries: { href: string; label: string; Icon: LucideIcon; pill?: string }[] = [
    { href: "/mobile/analytics", label: t("nav.analytics"), Icon: ChartColumn, pill: me.plan !== "PRO" ? "Pro" : undefined },
    { href: "/mobile/simulations", label: t("nav.simulations"), Icon: Calculator },
    { href: "/mobile/updates", label: t("nav.updates"), Icon: Megaphone },
    { href: "/mobile/support", label: t("header.support"), Icon: LifeBuoy },
    ...(me.isAdmin ? [{ href: "/mobile/support/admin", label: t("header.tickets"), Icon: ShieldCheck, pill: "Admin" }] : []),
    { href: "/mobile/settings", label: t("nav.settings"), Icon: Settings },
    { href: "/mobile/settings?tab=profile", label: t("header.profile"), Icon: UserRound },
  ];
  return (
    <>
      <nav aria-label={t("nav.more")}>
        <ul className="m-0 flex list-none flex-col p-0">
          {entries.map(({ href, label, Icon, pill }) => (
            <li key={href}>
              <Link href={href} className={item}>
                <span className={icon} aria-hidden="true"><Icon size={18} /></span>
                <span className="grow">{label}</span>
                {pill && <Badge variant="secondary" className="bg-ok-bg text-[11px] font-semibold text-leaf">{pill}</Badge>}
                <ChevronRight size={18} className="text-ink-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form action={setView}>
        <input type="hidden" name="view" value="desktop" />
        <button className={`${item} w-full cursor-pointer border-x-0 border-t-0 bg-transparent px-0 font-sans`}>
          <span className={icon} aria-hidden="true"><Monitor size={18} /></span>
          <span className="grow text-left">{t("nav.desktopView")}</span>
        </button>
      </form>
    </>
  );
}
