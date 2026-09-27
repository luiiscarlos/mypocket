// Form primitives shared by the site and the dashboard. Safe to import from client components.
import Link from "next/link";
import type { ReactNode } from "react";

export const inputClass =
  "h-[52px] w-full border border-ink bg-field px-4 font-sans text-base text-ink";
export const labelClass = "flex flex-col gap-2 text-sm font-semibold";
export const primaryButton =
  "h-14 w-full cursor-pointer border-0 bg-leaf px-8 font-sans text-base font-semibold text-on-leaf hover:opacity-90 disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-muted";

export function Notice({ kind, children }: { kind: "error" | "status"; children: ReactNode }) {
  return kind === "error" ? (
    <div role="alert" className="border border-danger bg-danger-bg px-4 py-3.5 text-[15px] text-danger-ink">
      {children}
    </div>
  ) : (
    <div role="status" className="border border-leaf bg-ok-bg px-4 py-3.5 text-[15px] text-ink">
      {children}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-ink underline">
      {children}
    </Link>
  );
}
