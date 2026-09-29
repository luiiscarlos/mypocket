"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, House, Landmark, Menu, Plus, type LucideIcon } from "lucide-react";

type Tab = { href: string; key: "home" | "netWorth" | "add" | "transactions" | "more"; Icon: LucideIcon; match: (path: string) => boolean };

// Design "InicioMovil": Inicio · Patrimonio · Añadir (green) · Movimientos · Más.
// "Más" stays active for the screens it links to (analytics, simulations, settings, updates, support).
const TABS: Tab[] = [
  { href: "/mobile", key: "home", Icon: House, match: (p) => p === "/mobile" },
  { href: "/mobile/net-worth", key: "netWorth", Icon: Landmark, match: (p) => p.startsWith("/mobile/net-worth") },
  { href: "/mobile/transactions?new=1", key: "add", Icon: Plus, match: () => false },
  { href: "/mobile/transactions", key: "transactions", Icon: ArrowLeftRight, match: (p) => p.startsWith("/mobile/transactions") },
  { href: "/mobile/more", key: "more", Icon: Menu, match: (p) => /^\/mobile\/(more|analytics|simulations|settings|updates|support)/.test(p) },
];

/** Bottom tab bar: the lower edge of the rounded panel (76 px + safe area). */
export function MobileTabBar() {
  const t = useTranslations("app.nav");
  const pathname = usePathname();
  return (
    <nav
      aria-label={t("label")}
      // Phones with a home indicator (inset > 0): flush with the bottom edge, no corners, the indicator's
      // space as inner padding. Elsewhere: the 8 px shell frame and rounded corners of the design.
      className="fixed inset-x-[max(0px,calc(8px-env(safe-area-inset-bottom)*100))] bottom-[max(0px,calc(8px-env(safe-area-inset-bottom)*100))] z-20 rounded-b-[max(0px,calc(20px-env(safe-area-inset-bottom)*100))] border border-rule bg-panel px-2 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <ul className="m-0 grid list-none grid-cols-5 p-0">
        {TABS.map(({ href, key, Icon, match }) => {
          const add = key === "add";
          const active = match(pathname);
          return (
            <li key={key} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={add ? t("newTransaction") : undefined}
                className={`mx-[3px] flex h-[52px] grow flex-col items-center justify-center gap-[3px] rounded-[14px] text-[11px] hover:no-underline ${
                  add ? "bg-leaf font-semibold text-on-leaf" : "font-medium text-ink-muted aria-[current=page]:bg-active aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                }`}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden />
                {t(key === "transactions" ? "transactionsShort" : key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
