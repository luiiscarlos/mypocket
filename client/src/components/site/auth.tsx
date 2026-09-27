import Link from "next/link";
import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Logo, eyebrow } from "./chrome";

// Sample figures from the design, not real data. Widths make the cards look stacked behind the total.
const STACK = [
  { name: null, amount: 680, dot: "bg-mist/50", card: "w-[77%] h-[52px] px-5 bg-white/[0.08]" },
  { name: "BBVA", amount: 8566.24, dot: "bg-mist", card: "w-[85%] h-14 px-[22px] bg-white/[0.12]" },
  { name: "Trade Republic", amount: 15072.18, dot: "bg-mint", card: "w-[92%] h-[60px] px-6 bg-white/[0.16]" },
];
const SAMPLE_TOTAL = 24318.42;

/** Split layout shared by login, signup and password pages. */
export function AuthShell({
  kicker,
  title,
  intro,
  tagline,
  children,
}: {
  kicker: string;
  title: string;
  intro: ReactNode;
  /** Short phrase at the bottom of the green panel; different on each page. */
  tagline: string;
  children: ReactNode;
}) {
  const t = useTranslations("auth");
  const format = useFormatter();
  const eur = (n: number) => format.number(n, { style: "currency", currency: "EUR" });

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <aside className="hidden flex-col bg-strip px-[72px] pb-16 text-on-strip lg:flex">
        <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-cream/20">
          <Logo />
          <span className="font-mono text-xs tracking-[0.06em] text-mist">{t("panel.summary")}</span>
        </div>

        <div className="flex grow items-center justify-center py-10" aria-hidden="true">
          <div className="flex w-full max-w-[520px] flex-col items-center">
            {STACK.map((a) => (
              <div key={a.card} className={`flex items-center justify-between text-[15px] ${a.card}`}>
                <span className="flex items-center gap-2.5">
                  <span className={`block size-2 ${a.dot}`} />
                  {a.name ?? t("panel.cash")}
                </span>
                <span className="font-mono">{eur(a.amount)}</span>
              </div>
            ))}
            <div className="flex w-full flex-col gap-5 bg-cream p-8 text-night">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs tracking-[0.06em] text-night-muted">{t("panel.total")}</span>
                <span className="font-mono text-[13px] text-brand">{t("panel.thisMonth")}</span>
              </div>
              <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em] xl:text-[56px]">{eur(SAMPLE_TOTAL)}</div>
              <div className="flex h-2.5 gap-[3px]">
                <div className="grow-[62] bg-night" />
                <div className="grow-[35] bg-[#6B7069]" />
                <div className="grow-[3] bg-[#B7B9B1]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-8 border-t border-cream/20 pt-7">
          <div className="max-w-[340px] text-[34px] font-extrabold leading-none tracking-[-0.04em]">{tagline}</div>
          <div className="flex items-center gap-2 whitespace-nowrap font-mono text-xs text-mist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {t("panel.readOnly")}
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-5 lg:px-20">
        <div className="flex h-[88px] shrink-0 items-center justify-between text-[15px] lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="text-ink-muted hover:underline">
            {t("backToSite")}
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
