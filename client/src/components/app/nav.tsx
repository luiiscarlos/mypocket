"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight, Calculator, ChartColumn, House, Landmark, Menu, Plus, type LucideIcon,
} from "lucide-react";

type Entry = { href: string; key: "home" | "netWorth" | "transactions" | "analytics" | "simulations" | "updates" | "settings" | "add" | "more"; Icon: LucideIcon };

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
const icon = { size: 20, strokeWidth: 1.9, "aria-hidden": true } as const;

/** Sidebar entries. Collapsed: icons only, the label stays as tooltip and accessible name. */
export function SideNav({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {SIDE.map(({ href, key, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              title={collapsed ? t(key) : undefined}
              aria-label={collapsed ? t(key) : undefined}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-control text-[15px] text-ink-muted group hover:bg-active hover:text-ink hover:no-underline aria-[current=page]:bg-active aria-[current=page]:font-semibold aria-[current=page]:text-ink ${
                collapsed ? "justify-center" : "px-3"
              }`}
            >
              <Icon {...icon} className="group-aria-[current=page]:text-leaf" />
              {!collapsed && t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-paper lg:hidden">
      <ul className="m-0 grid h-[72px] list-none grid-cols-5 p-0">
        {BOTTOM.map(({ href, key, Icon }) => (
          <li key={key} className="flex">
            <Link
              href={href}
              aria-current={isActive(pathname, href) && key !== "add" ? "page" : undefined}
              className={`flex grow flex-col items-center justify-center gap-1 text-[11px] hover:no-underline ${
                key === "add" ? "bg-leaf text-on-leaf" : "text-ink-muted aria-[current=page]:font-semibold aria-[current=page]:text-ink"
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
