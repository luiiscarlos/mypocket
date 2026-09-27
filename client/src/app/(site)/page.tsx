import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight, Banknote, Calculator, CalendarDays, ChartColumn, Check, ChevronDown, LifeBuoy, Lock, LogOut, Megaphone, Moon, Repeat,
  Settings, TrendingUp, UserRound, type LucideIcon,
} from "lucide-react";
import { CtaBand, PageHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { PlanCards } from "@/components/site/plans";

// Sample figures from the design, not real data.
const ACCOUNTS = [
  { name: "Trade Republic", amount: "15.072,18 €", dot: "bg-s1" },
  { name: "BBVA", amount: "8.566,24 €", dot: "bg-s2" },
  { name: "cash", amount: "680,00 €", dot: "bg-s3" },
  { name: "investments", amount: "12.480,00 €", dot: "bg-leaf" },
] as const;

const MENU: ["profile" | "settings" | "updates" | "support" | "appearance" | "logout", LucideIcon][] = [["profile", UserRound], ["settings", Settings], ["updates", Megaphone], ["support", LifeBuoy], ["appearance", Moon], ["logout", LogOut]];
const STEPS = ["accounts", "cash", "total"] as const;
const FEATURES: { key: "investments" | "simulations" | "analytics" | "recurring" | "accounts" | "summary"; Icon: LucideIcon; isNew?: boolean; pro?: boolean }[] = [
  { key: "investments", Icon: TrendingUp, isNew: true, pro: true },
  { key: "simulations", Icon: Calculator, isNew: true },
  { key: "analytics", Icon: ChartColumn, pro: true },
  { key: "recurring", Icon: Repeat },
  { key: "accounts", Icon: Banknote },
  { key: "summary", Icon: CalendarDays },
];
const TICKET = [["milk", "3,48"], ["fruit", "6,85"], ["coffee", "9,77"], ["other", "3,30"]] as const;

const h2 = "m-0 text-4xl font-bold leading-[1.05] tracking-[-0.04em] lg:text-[52px]";
const badge = "inline-flex h-[26px] items-center rounded-full bg-ok-bg px-2.5 text-xs font-semibold text-leaf";

export default function LandingPage() {
  const t = useTranslations("home");
  return (
    <SitePage>
      {/* The first screen fills the viewport: 100svh minus the 72 px sticky header. */}
      <PageHero className="min-h-[calc(100svh-72px)] justify-between gap-10 pb-10 pt-12 lg:pt-0">
        <div className="grid grow grid-cols-1 items-center gap-12 lg:grid-cols-[5fr_6fr] lg:gap-16">
          <div className="flex flex-col gap-7">
            <span className="inline-flex h-8 items-center gap-2 self-start rounded-full bg-ok-bg px-3.5 text-[13px] font-semibold text-leaf">
              <span className="block size-1.5 rounded-full bg-leaf" />
              {t("badge")}
            </span>
            <h1 className="m-0 text-5xl font-bold leading-none tracking-[-0.045em] sm:text-6xl xl:text-[76px]">
              {t("title1")}
              <br />
              <span className="text-leaf">{t("title2")}</span>
            </h1>
            <p className="m-0 max-w-[480px] text-[19px] leading-[1.55] text-ink-muted">{t("lead")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="btn inline-flex h-[54px] items-center gap-2.5 rounded-[14px] bg-leaf px-6 text-base font-semibold text-on-leaf hover:no-underline">
                {t("createAccount")} <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="#how-it-works" className="btn inline-flex h-[54px] items-center rounded-[14px] bg-band px-6 text-base font-semibold text-ink hover:no-underline">
                {t("seeHow")}
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-ink-muted">
              <span className="flex items-center gap-2"><Lock size={16} className="text-leaf" aria-hidden />{t("trust.psd2")}</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-leaf" aria-hidden />{t("trust.free")}</span>
            </div>
          </div>

          {/* Product preview (decorative): the dashboard with the avatar menu open. */}
          <div aria-hidden="true" className="relative hidden h-[600px] flex-col gap-4 rounded-block border border-rule bg-band p-5 sm:flex">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[17px] font-bold tracking-[-0.02em]">{t("preview.hello")}</span>
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 items-center gap-1.5 rounded-full border border-rule bg-field px-2.5 text-xs">ES</span>
                <span className="flex size-[34px] items-center justify-center rounded-full bg-leaf text-xs font-bold text-on-leaf">LU</span>
              </span>
            </div>
            <div className="flex flex-col gap-3.5 rounded-card bg-field p-6 shadow-soft">
              <span className="font-mono text-[11px] tracking-[0.06em] text-ink-muted">{t("preview.current")}</span>
              <span className="font-mono text-5xl font-medium leading-none tracking-[-0.04em]">36.798,42 €</span>
              <span className="font-mono text-[13px] text-leaf">{t("preview.thisMonth")}</span>
              <div className="grid grid-cols-2 gap-3 pt-1.5">
                <div className="flex flex-col gap-0.5 rounded-control bg-band px-3.5 py-3"><span className="text-xs text-ink-muted">{t("preview.endOfMonth")}</span><span className="font-mono text-[17px]">36.518,52 €</span></div>
                <div className="flex flex-col gap-0.5 rounded-control bg-band px-3.5 py-3"><span className="text-xs text-ink-muted">{t("preview.afterDebts")}</span><span className="font-mono text-[17px]">27.748,42 €</span></div>
              </div>
            </div>
            <div className="flex flex-col rounded-card bg-field px-5 py-2 shadow-soft">
              {ACCOUNTS.map((a, i) => (
                <div key={a.name} className={`flex h-[52px] items-center gap-3 ${i < ACCOUNTS.length - 1 ? "border-b border-rule" : ""}`}>
                  <span className="flex size-8 items-center justify-center rounded-[10px] bg-band"><span className={`block size-2.5 rounded-full ${a.dot}`} /></span>
                  <span className="grow text-sm font-semibold">{a.name === "cash" || a.name === "investments" ? t(`preview.${a.name}`) : a.name}</span>
                  <span className="font-mono text-sm">{a.amount}</span>
                </div>
              ))}
            </div>
            <div className="absolute right-5 top-16 flex w-[220px] flex-col rounded-2xl border border-rule bg-field p-2 shadow-float">
              <div className="flex flex-col gap-0.5 border-b border-rule px-3 pb-3 pt-2.5"><span className="text-sm font-semibold">Luis</span><span className="text-xs text-ink-muted">{t("preview.plan")}</span></div>
              {MENU.map(([key, Icon], i) => (
                <span key={key} className={`flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-sm ${i === 0 ? "bg-band" : ""} ${key === "logout" ? "text-ink-muted" : ""}`}>
                  <Icon size={16} />
                  {t(`preview.menu.${key}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Link href="#how-it-works" className="flex flex-col items-center gap-1.5 self-center text-[13px] text-ink-muted hover:no-underline">
          {t("discover")}
          <ChevronDown size={16} aria-hidden />
        </Link>
      </PageHero>

      <section id="how-it-works" className="flex scroll-mt-[72px] flex-col items-center gap-14 bg-band band py-24 lg:py-[120px]">
        <div className="flex max-w-[720px] flex-col items-center gap-4 text-center">
          <span className={eyebrow}>{t("how.eyebrow")}</span>
          <h2 className={h2}>{t("how.title")}</h2>
          <p className="m-0 text-lg leading-[1.55] text-ink-muted">{t("how.lead")}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col gap-4 rounded-[24px] bg-field p-8">
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-ok-bg font-mono text-[15px] font-medium text-leaf">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="m-0 text-[22px] font-bold tracking-[-0.02em]">{t(`how.${step}.title`)}</h3>
              <p className="m-0 text-base leading-[1.55] text-ink-muted">{t(`how.${step}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="flex scroll-mt-[72px] flex-col gap-12 band py-24 lg:py-[120px]">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-16">
          <div className="flex flex-col gap-4">
            <span className={eyebrow}>{t("features.eyebrow")}</span>
            <h2 className={`${h2} max-w-[620px]`}>{t("features.title")}</h2>
          </div>
          <p className="m-0 max-w-[360px] text-[17px] leading-[1.55] text-ink-muted">{t("features.lead")}</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, Icon, isNew, pro }) => (
            <article key={key} className="flex flex-col gap-4 rounded-[24px] bg-band p-7">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-[14px] bg-field"><Icon size={22} strokeWidth={1.8} aria-hidden /></span>
                <span className="flex gap-1.5">
                  {isNew && <span className={badge}>{t("features.new")}</span>}
                  {pro && <span className={badge}>Pro</span>}
                </span>
              </div>
              <h3 className="m-0 text-[21px] font-bold tracking-[-0.02em]">{t(`features.${key}.title`)}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-ink-muted">{t(`features.${key}.text`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tickets" className="scroll-mt-[72px] band pb-24 lg:pb-[120px]">
        <div className="grid grid-cols-1 items-center gap-14 rounded-[32px] bg-band p-8 lg:grid-cols-[5fr_6fr] lg:p-16">
          <div className="flex flex-col gap-5">
            <span className={`${eyebrow} flex items-center gap-2`}>{t("tickets.eyebrow")} <span className={badge}>Pro</span></span>
            <h2 className="m-0 text-4xl font-bold leading-[1.05] tracking-[-0.04em] lg:text-[44px]">{t("tickets.title")}</h2>
            <p className="m-0 text-[17px] leading-[1.55] text-ink-muted">{t("tickets.lead")}</p>
          </div>
          <div aria-hidden="true" className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="flex w-[200px] shrink-0 -rotate-3 flex-col gap-2 rounded-2xl bg-white px-5 py-[22px] font-mono text-xs text-night shadow-soft">
              <span className="text-center font-medium">MERCADONA</span>
              <span className="text-center text-night-muted">22/09/2026</span>
              <span className="my-1 border-t border-dashed border-[#C9C2B4]" />
              {TICKET.map(([item, price]) => (
                <span key={item} className="flex justify-between"><span>{t(`tickets.items.${item}`)}</span><span>{price}</span></span>
              ))}
              <span className="my-1 border-t border-dashed border-[#C9C2B4]" />
              <span className="flex justify-between text-sm font-medium"><span>TOTAL</span><span>23,40</span></span>
            </div>
            <div className="flex w-full grow flex-col gap-3">
              <div className="flex flex-col gap-3 rounded-[18px] border-2 border-leaf bg-field p-[18px]">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-leaf"><Check size={14} strokeWidth={2.4} />{t("tickets.match")}</span>
                <span className="flex justify-between text-[15px]"><span className="font-semibold">Mercadona · BBVA</span><span className="font-mono">−23,40 €</span></span>
                <span className="flex h-[42px] items-center justify-center rounded-control bg-leaf text-sm font-semibold text-on-leaf">{t("tickets.link")}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] bg-field p-[18px]">
                <span className="text-sm text-ink-muted">{t("tickets.paidCash")}</span>
                <span className="inline-flex h-[38px] items-center rounded-[10px] border border-rule px-3.5 text-sm font-semibold">{t("tickets.createCash")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="flex scroll-mt-[72px] flex-col items-center gap-12 bg-band band py-24 lg:py-[120px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className={eyebrow}>{t("pricing.eyebrow")}</span>
          <h2 className={h2}>{t("pricing.title")}</h2>
        </div>
        <PlanCards />
        <Link href="/pricing" className="text-[15px] font-semibold text-ink underline">{t("pricing.compare")}</Link>
      </section>

      <CtaBand />
      <SiteFooter />
    </SitePage>
  );
}
