"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeftRight, Calculator, ChartColumn, House, Landmark, Menu, Plus, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Key = "home" | "netWorth" | "transactions" | "analytics" | "simulations" | "add" | "more";
type Entry = { href: string; key: Key; Icon: LucideIcon };

// Design v3 "Sidebar": 5 entries; Analytics carries a "Pro" pill on the Free plan.
const SIDE: Entry[] = [
  { href: "/dashboard", key: "home", Icon: House },
  { href: "/dashboard/net-worth", key: "netWorth", Icon: Landmark },
  { href: "/dashboard/transactions", key: "transactions", Icon: ArrowLeftRight },
  { href: "/dashboard/analytics", key: "analytics", Icon: ChartColumn },
  { href: "/dashboard/simulations", key: "simulations", Icon: Calculator },
];

// Mobile bottom bar: 5 entries, the middle one is "Add".
const BOTTOM: Entry[] = [
  { href: "/dashboard", key: "home", Icon: House },
  { href: "/dashboard/net-worth", key: "netWorth", Icon: Landmark },
  { href: "/dashboard/transactions?new=1", key: "add", Icon: Plus },
  { href: "/dashboard/analytics", key: "analytics", Icon: ChartColumn },
  { href: "/dashboard/settings", key: "more", Icon: Menu },
];

const isActive = (pathname: string, href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

export function SideNav({ collapsed, free }: { collapsed: boolean; free: boolean }) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {SIDE.map(({ href, key, Icon }) => {
          const link = (
            <Link
              href={href}
              aria-label={collapsed ? t(key) : undefined}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={`group flex h-11 items-center gap-3 rounded-control text-[15px] text-ink-muted hover:bg-field/60 hover:text-ink hover:no-underline aria-[current=page]:bg-field aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:shadow-soft ${
                collapsed ? "justify-center" : "px-3"
              }`}
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden className="shrink-0 group-aria-[current=page]:text-leaf" />
              {!collapsed && <span className="grow">{t(key)}</span>}
              {!collapsed && free && key === "analytics" && (
                <Badge variant="secondary" className="bg-ok-bg text-[11px] font-semibold text-leaf">Pro</Badge>
              )}
            </Link>
          );
          return (
            <li key={href}>
              {collapsed ? (
                // Collapsed rail: the name shows in a shadcn Tooltip on hover/focus.
                <Tooltip>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right" sideOffset={8}>{t(key)}</TooltipContent>
                </Tooltip>
              ) : link}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Page title in the top bar, from the current route (it is the page's h1). */
export function TopbarTitle({ name, greeting = true }: { name: string; greeting?: boolean }) {
  const t = useTranslations("app");
  const format = useFormatter();
  const pathname = usePathname();
  const section = pathname.split("/")[2] ?? "";
  const titles: Record<string, string> = {
    "": greeting ? (name ? t("home.hello", { name }) : t("home.helloAnon")) : t("nav.home"),
    "net-worth": t("nav.netWorth"),
    transactions: t("nav.transactions"),
    analytics: t("nav.analytics"),
    simulations: t("nav.simulations"),
    updates: t("nav.updates"),
    settings: t("nav.settings"),
    more: t("nav.more"),
    support: pathname.endsWith("/admin") ? t("support.adminTitle") : t("support.title"),
  };
  return (
    <div className="flex min-w-0 items-baseline gap-3">
      <h1 className="m-0 truncate text-[22px] font-bold tracking-[-0.03em]">{titles[section] ?? t("nav.home")}</h1>
      {section === "" && (
        <span className="hidden text-sm text-ink-muted first-letter:uppercase sm:inline">{format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "long" })}</span>
      )}
    </div>
  );
}

export function BottomNav() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-side lg:hidden">
      <ul className="m-0 grid h-[72px] list-none grid-cols-5 p-0">
        {BOTTOM.map(({ href, key, Icon }) => (
          <li key={key} className="flex p-1.5">
            <Link
              href={href}
              aria-current={isActive(pathname, href) && key !== "add" ? "page" : undefined}
              className={`flex grow flex-col items-center justify-center gap-1 rounded-control text-[11px] hover:no-underline ${
                key === "add" ? "bg-leaf text-on-leaf" : "text-ink-muted aria-[current=page]:bg-field aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              }`}
            >
              <Icon size={22} strokeWidth={1.9} aria-hidden />
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
