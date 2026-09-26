import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, eyebrow } from "./chrome";

// Sample figures from the design, not real data.
const SAMPLE = [
  ["Trade Republic", "15.072,18 €"],
  ["BBVA", "8.566,24 €"],
  ["Efectivo", "680,00 €"],
];

export const inputClass =
  "h-[52px] w-full border border-ink bg-white px-4 font-sans text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
export const labelClass = "flex flex-col gap-2 text-sm font-semibold";
export const primaryButton =
  "h-14 w-full cursor-pointer border-0 bg-brand px-8 font-sans text-base font-semibold text-cream hover:bg-brand/90";

/** Split layout shared by login, signup and password pages. */
export function AuthShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <aside className="hidden flex-col bg-brand px-20 pb-20 text-cream lg:flex">
        <div className="flex h-[88px] shrink-0 items-center border-b border-cream/20">
          <Logo />
        </div>
        <div className="mt-auto flex flex-col gap-12">
          <div className="text-[88px] font-extrabold leading-[0.9] tracking-[-0.055em]">
            Todo tu dinero, en un único sitio.
          </div>
          <div className="flex flex-col font-mono text-[15px]" aria-hidden="true">
            {SAMPLE.map(([name, amount]) => (
              <div key={name} className="flex justify-between border-t border-cream/20 py-3">
                <span>{name}</span>
                <span>{amount}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t-[3px] border-cream pt-3.5">
              <span className="text-xs tracking-[0.06em]">TOTAL</span>
              <span className="text-[28px] font-medium tracking-[-0.03em]">24.318,42 €</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-5 lg:px-20">
        <div className="flex h-[88px] shrink-0 items-center justify-between text-[15px] lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="text-ink-muted hover:underline">
            ← Volver a la web
          </Link>
        </div>
        <div className="flex grow items-center justify-center py-10">
          <div className="flex w-full max-w-[420px] flex-col gap-7">
            <div className="flex flex-col gap-3">
              <div className={`${eyebrow} text-ink-muted`}>{kicker}</div>
              <h1 className="m-0 text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[56px]">{title}</h1>
              <p className="m-0 text-base text-ink-muted">{intro}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function Notice({ kind, children }: { kind: "error" | "status"; children: ReactNode }) {
  return kind === "error" ? (
    <div role="alert" className="border border-danger bg-danger-bg px-4 py-3.5 text-[15px] text-danger-ink">
      {children}
    </div>
  ) : (
    <div role="status" className="border border-brand bg-ok-bg px-4 py-3.5 text-[15px] text-ink">
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
