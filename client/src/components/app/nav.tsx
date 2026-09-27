"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export const NAV = [
  { href: "/dashboard", key: "home" },
  { href: "/dashboard/net-worth", key: "netWorth" },
  { href: "/dashboard/transactions", key: "transactions" },
  { href: "/dashboard/analytics", key: "analytics" },
  { href: "/dashboard/simulations", key: "simulations" },
  { href: "/dashboard/updates", key: "updates" },
  { href: "/dashboard/settings", key: "settings" },
] as const;

/** Sidebar on desktop, horizontal scroller on mobile. Client only for the active state. */
export function NavLinks() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="-mx-5 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
      {NAV.map(({ href, key }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="shrink-0 border-b-2 border-transparent px-2 py-2.5 text-[15px] text-mist hover:text-cream hover:no-underline aria-[current=page]:border-cream aria-[current=page]:text-cream lg:border-b-0 lg:border-l-2 lg:px-4"
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
