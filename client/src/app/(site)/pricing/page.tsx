import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { CtaBand, GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("pricing") };
}

// true = included, "—" = not included, "unlimited" = translated label, anything else is shown as is.
type Cell = true | string;
type Row =
  | { group: "accounts" | "planning" | "pro" }
  | {
      label: "accounts" | "bank" | "balance" | "cash" | "recurring" | "simulations" | "summary" | "investments" | "analytics" | "predictions" | "ocr";
      free: Cell;
      pro: Cell;
    };

const ROWS: Row[] = [
  { group: "accounts" },
  { label: "accounts", free: "2", pro: "unlimited" },
  { label: "bank", free: "—", pro: true },
  { label: "balance", free: true, pro: true },
  { label: "cash", free: true, pro: true },
  { group: "planning" },
  { label: "recurring", free: true, pro: true },
  { label: "simulations", free: true, pro: true },
  { label: "summary", free: true, pro: true },
  { group: "pro" },
  { label: "investments", free: "—", pro: true },
  { label: "analytics", free: "—", pro: true },
  { label: "predictions", free: "—", pro: true },
  { label: "ocr", free: "—", pro: true },
];

const TRUST = ["readOnly", "noBank", "switch"] as const;

const grid = "grid grid-cols-[6fr_3fr_3fr]";

function Check({ light = false }: { light?: boolean }) {
  const t = useTranslations("pricing");
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={light ? "text-on-strip" : "text-ink"} strokeWidth="2.4" strokeLinecap="square" role="img" aria-label={t("included")}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export default function PricingPage() {
  const t = useTranslations("pricing");
  const plans = useTranslations("plans");
  const cell = (c: string) => (c === "unlimited" ? t("unlimited") : c);
  return (
    <SitePage>
      <GreenHero current="pricing" className="pb-16 lg:pb-20">
        <div className="grid grid-cols-1 items-end gap-8 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-20">
          <div className="flex flex-col gap-7 lg:col-span-8">
            <div className={eyebrow}>{t("eyebrow")}</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              {t("title1")}
              <br />
              {t("title2")}
            </h1>
          </div>
          <p className="m-0 text-[19px] leading-normal text-mist lg:col-span-4 lg:col-start-9">
            {t("lead")}
          </p>
        </div>
      </GreenHero>

      <section className="band py-20 lg:py-28">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]" role="table" aria-label={t("tableLabel")}>
            <div className={grid} role="row">
              <div role="columnheader" className="flex flex-col justify-end gap-3 border-b-[3px] border-ink pb-10 pr-8">
                <div className={`${eyebrow} text-ink-muted`}>{t("compare")}</div>
                <div className="max-w-[420px] text-[17px] leading-normal text-ink-muted">
                  {t("compareText")}
                </div>
              </div>
              <div role="columnheader" className="flex flex-col gap-5 border-b-[3px] border-ink p-8 lg:py-10">
                <div className="text-[30px] font-extrabold tracking-[-0.03em]">{plans("free")}</div>
                <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em]">
                  0 €<span className="text-sm tracking-normal text-ink-muted"> {plans("perMonth")}</span>
                </div>
                <div className="text-[15px] text-ink-muted">{t("freeTagline")}</div>
                <Link href="/register" className="btn flex h-[52px] items-center justify-center border border-ink text-[15px] font-semibold hover:no-underline">
                  {plans("startFree")}
                </Link>
              </div>
              <div role="columnheader" className="flex flex-col gap-5 border-b-[3px] border-ink bg-strip p-8 text-on-strip lg:py-10">
                <div className="flex items-center justify-between">
                  <div className="text-[30px] font-extrabold tracking-[-0.03em]">Pro</div>
                  <div className="border border-cream/60 px-2 py-[5px] font-mono text-[11px] tracking-[0.06em]">{t("recommended")}</div>
                </div>
                <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em]">
                  {plans("price")} €<span className="text-sm tracking-normal text-mist"> {plans("perMonth")}</span>
                </div>
                <div className="text-[15px] text-mist">{t("proTagline")}</div>
                <Link href="/register" className="btn flex h-[52px] items-center justify-center bg-mint text-[15px] font-semibold text-on-mint hover:no-underline">
                  {plans("tryPro")}
                </Link>
              </div>
            </div>

            {ROWS.map((row) =>
              "group" in row ? (
                <div key={row.group} className={grid} role="row">
                  <div role="rowheader" className="pb-3.5 pt-9 font-mono text-xs tracking-[0.06em] text-ink-muted">{t(`groups.${row.group}`)}</div>
                  <div role="cell" />
                  <div role="cell" className="bg-strip" />
                </div>
              ) : (
                <div key={row.label} className={`${grid} text-[17px]`} role="row">
                  <div role="rowheader" className="border-t border-rule py-[18px] pr-8">{t(`rows.${row.label}`)}</div>
                  <div role="cell" className="flex items-center border-t border-rule px-8 py-[18px] font-mono text-[15px]">
                    {row.free === true ? <Check /> : <span className={row.free === "—" ? "text-dash" : ""}>{cell(row.free)}</span>}
                  </div>
                  <div role="cell" className="flex items-center border-t border-cream/25 bg-strip px-8 py-[18px] font-mono text-[15px] text-on-strip">
                    {row.pro === true ? <Check light /> : <span>{cell(row.pro)}</span>}
                  </div>
                </div>
              ),
            )}

            <div className={grid} aria-hidden="true">
              <div className="border-t-[3px] border-ink" />
              <div className="border-t-[3px] border-ink" />
              <div className="h-8 border-t-[3px] border-ink bg-strip" />
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-12 bg-band band py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TRUST.map((key) => (
            <div key={key} className="flex flex-col gap-3.5 border-t-[3px] border-ink pt-6">
              <h3 className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{t(`trust.${key}.title`)}</h3>
              <p className="m-0 text-base leading-[1.55] text-ink-muted">{t(`trust.${key}.text`)}</p>
            </div>
          ))}
        </div>
        <Link href="/faq" className="inline-flex items-center gap-2.5 self-start border-b-2 border-ink pb-1 text-[17px] font-semibold hover:no-underline">
          {t("allFaq")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </section>

      <CtaBand />
      <SiteFooter />
    </SitePage>
  );
}
