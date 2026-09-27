import Link from "next/link";
import { useTranslations } from "next-intl";
import { CtaBand, GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { PlanCards } from "@/components/site/plans";

// Sample figures from the design, not real data.
const ACCOUNTS = [
  { color: "bg-s1", name: "Trade Republic", meta: "tradeRepublic", amount: "15.072,18 €", share: "62 %" },
  { color: "bg-s2", name: "BBVA", meta: "bbva", amount: "8.566,24 €", share: "35 %" },
  { color: "bg-s3", name: "cash", meta: "manual", amount: "680,00 €", share: "3 %" },
] as const;

const STEPS = ["connect", "cash", "total"] as const;

const icon = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "square" as const, "aria-hidden": true };

const FEATURES = [
  {
    key: "analytics",
    icon: <svg {...icon}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  },
  {
    key: "summary",
    icon: <svg {...icon}><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  },
  {
    key: "predictions",
    icon: <svg {...icon}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>,
  },
  {
    key: "subscriptions",
    icon: <svg {...icon}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v4h-4" /><path d="M12 8v4l3 2" /></svg>,
  },
] as const;

const TICKET = [["milk", "3,48"], ["bread", "1,20"], ["fruit", "6,85"], ["pasta", "2,10"], ["coffee", "9,77"]] as const;

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const h2 = "m-0 text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] lg:text-[64px]";

export default function LandingPage() {
  const t = useTranslations("home");
  return (
    <SitePage>
      <GreenHero className="pb-20 lg:pb-28">
        <div className="grid grid-cols-1 items-center gap-12 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-24">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <div className={eyebrow}>{t("eyebrow")}</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              {t("title")}
            </h1>
            <p className="m-0 max-w-[520px] text-xl leading-normal text-mist">
              {t("lead")}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link href="/register" className="btn inline-flex h-14 items-center gap-2.5 bg-mint px-7 text-base font-semibold text-on-mint hover:no-underline">
                {t("createAccount")} {arrow}
              </Link>
              <Link href="#how-it-works" className="btn inline-flex h-14 items-center border border-cream/50 px-7 text-base font-medium hover:no-underline">
                {t("seeHow")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-paper p-6 text-ink sm:p-8 lg:col-span-5 lg:col-start-8" aria-label={t("sample.label")}>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="font-mono text-xs tracking-[0.06em] text-ink-muted">{t("sample.total")}</div>
                <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em] sm:text-[44px]">24.318,42 €</div>
                <div className="font-mono text-[13px] text-leaf">{t("sample.thisMonth")}</div>
              </div>
              <div className="border border-ink px-2.5 py-1.5 font-mono text-xs">{t("sample.accounts")}</div>
            </div>
            <div className="flex h-3 gap-[3px]" aria-hidden="true">
              <div className="grow-[62] bg-s1" />
              <div className="grow-[35] bg-s2" />
              <div className="grow-[3] bg-s3" />
            </div>
            <div className="flex flex-col">
              {ACCOUNTS.map((a) => (
                <div key={a.name} className="flex items-center gap-3.5 border-t border-ink py-4">
                  <div className={`size-2.5 shrink-0 ${a.color}`} />
                  <div className="flex grow flex-col gap-0.5">
                    <div className="text-[17px] font-semibold">{a.name === "cash" ? t("sample.cash") : a.name}</div>
                    <div className="text-[13px] text-ink-muted">{t(`sample.${a.meta}`)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 font-mono">
                    <div className="text-base">{a.amount}</div>
                    <div className="text-xs text-ink-muted">{a.share}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn flex h-12 items-center justify-center gap-2 border border-dashed border-dash text-sm font-medium text-ink-muted hover:no-underline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("sample.connectAnother")}
            </Link>
          </div>
        </div>
      </GreenHero>

      <section id="how-it-works" className="flex scroll-mt-4 flex-col gap-16 band py-20 lg:py-28">
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <h2 className={`${h2} lg:col-span-7`}>{t("how.title")}</h2>
          <p className="m-0 text-[17px] leading-[1.55] text-ink-muted lg:col-span-5 lg:col-start-8">
            {t("how.lead")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col gap-4 border-t-[3px] border-ink pt-6">
              <div className="text-[56px] font-extrabold leading-none tracking-[-0.04em] text-ink">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="m-0 text-2xl font-semibold tracking-[-0.02em]">{t(`how.${step}.title`)}</h3>
              <p className="m-0 text-base leading-[1.55] text-ink-muted">{t(`how.${step}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="flex scroll-mt-4 flex-col gap-12 band pb-20 lg:pb-28">
        <div className="flex flex-col justify-between gap-6 border-b-[3px] border-ink pb-6 lg:flex-row lg:items-end lg:gap-20">
          <h2 className={`${h2} max-w-[760px]`}>{t("features.title")}</h2>
          <div className="font-mono text-[13px] text-ink-muted">{t("features.count")}</div>
        </div>
        <div className="grid grid-cols-1 border border-ink sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <article
              key={f.key}
              className={`flex flex-col gap-5 px-7 py-8 text-ink ${i < FEATURES.length - 1 ? "border-b border-ink lg:border-b-0 lg:border-r" : ""} ${i % 2 === 0 ? "sm:border-r" : ""}`}
            >
              {f.icon}
              <h3 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-ink">{t(`features.${f.key}.title`)}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-ink-muted">{t(`features.${f.key}.text`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tickets" className="grid scroll-mt-4 grid-cols-1 items-center gap-12 bg-band band py-20 lg:grid-cols-12 lg:gap-x-6 lg:py-28">
        <div className="flex flex-col gap-7 lg:col-span-5">
          <div className={`${eyebrow} text-ink-muted`}>{t("tickets.eyebrow")}</div>
          <h2 className={h2}>{t("tickets.title")}</h2>
          <p className="m-0 text-[17px] leading-[1.55] text-ink-muted">
            {t("tickets.lead")}
          </p>
          <ul className="m-0 flex list-none flex-col p-0 text-base">
            <li className="flex items-center gap-3.5 border-t border-ink py-3.5">
              <span className="font-mono text-xs text-ink">A.</span>{t("tickets.a")}
            </li>
            <li className="flex items-center gap-3.5 border-y border-ink py-3.5">
              <span className="font-mono text-xs text-ink">B.</span>{t("tickets.b")}
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-end lg:col-span-6 lg:col-start-7" aria-hidden="true">
          <div className="flex w-[200px] -rotate-3 flex-col gap-2.5 border border-rule bg-white px-5 py-7 font-mono text-xs text-night">
            <div className="text-center text-[13px] font-medium">MERCADONA</div>
            <div className="text-center text-night-muted">22/09/2026 · 18:42</div>
            <div className="my-1.5 border-t border-dashed border-dash" />
            {TICKET.map(([item, price]) => (
              <div key={item} className="flex justify-between"><span>{t(`tickets.items.${item}`)}</span><span>{price}</span></div>
            ))}
            <div className="my-1.5 border-t border-dashed border-dash" />
            <div className="flex justify-between text-sm font-medium"><span>TOTAL</span><span>23,40</span></div>
          </div>

          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" className="shrink-0 rotate-90 sm:rotate-0">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>

          <div className="flex w-full max-w-[260px] flex-col gap-4">
            <div className="flex flex-col gap-3.5 bg-strip p-[22px] text-on-strip">
              <div className="font-mono text-[11px] tracking-[0.06em]">{t("tickets.match")}</div>
              <div className="flex items-baseline gap-3">
                <div className="flex grow flex-col gap-0.5">
                  <div className="text-[17px] font-semibold">Mercadona</div>
                  <div className="text-[13px] text-mist">BBVA · {t("tickets.date")}</div>
                </div>
                <div className="font-mono text-[15px]">−23,40 €</div>
              </div>
              <div className="flex h-11 items-center justify-center bg-mint text-sm font-semibold text-on-mint">{t("tickets.link")}</div>
            </div>
            <div className="flex flex-col gap-3.5 border border-ink bg-paper p-[22px]">
              <div className="text-[15px] text-ink-muted">{t("tickets.paidCash")}</div>
              <div className="flex h-11 items-center justify-center border border-ink text-sm font-semibold">{t("tickets.createCash")}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="flex flex-col gap-12 band py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-4 border-b-[3px] border-ink pb-6 lg:flex-row lg:items-end">
          <h2 className={h2}>{t("pricing.title")}</h2>
          <div className="font-mono text-[13px] text-ink-muted">{t("pricing.tagline")}</div>
        </div>
        <PlanCards />
      </section>

      <CtaBand centered />
      <SiteFooter />
    </SitePage>
  );
}
