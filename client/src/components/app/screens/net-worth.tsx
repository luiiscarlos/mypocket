import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Lock, TriangleAlert } from "lucide-react";
import {
  AccountList, AddAccount, AddExpense, ExpenseList, InvestmentList, InvestmentSearch, searchInstruments,
} from "@/components/app/finance";
import { EmptyAction, EmptyState, PageNotice, Section, pick, primaryBtn } from "@/components/app/ui";
import { getNetWorth } from "@/lib/queries";
import { appNotice } from "@/lib/auth-codes";

const VIEWS = ["all", "accounts", "investments", "debts", "recurring"] as const;
const SORTS = ["amount", "name", "next"] as const;
const FREE_BANK_ACCOUNTS = 2;

// Design v3 "Patrimonio": current balance + projections, 4 total cards, a filter bar (view chips with
// counts, sort and direction, all in the URL) and one card per list. Free plan: accounts limit notice
// and a locked Investments card.
export async function NetWorthScreen({ base, searchParams }: { base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const PAGE = `${base}/net-worth`;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const view = pick(sp.view, VIEWS) ?? "all";
  const sort = pick(sp.sort, SORTS) ?? "amount";
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const [t, pro, format, notice, search, data] = await Promise.all([
    getTranslations("app.netWorth"),
    getTranslations("app.pro"),
    getFormatter(),
    appNotice(sp as { error?: string; message?: string }),
    searchInstruments(q),
    getNetWorth(),
  ]);
  const { me } = data;
  const isPro = me.plan === "PRO";
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const url = (changes: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ q, view, sort, dir, ...changes }).filter(([k, v]) => v && !(k === "view" && v === "all") && !(k === "sort" && v === "amount") && !(k === "dir" && v === "desc")) as [string, string][]);
    return p.size ? `${PAGE}?${p}` : PAGE;
  };
  const back = url({});

  // One comparator for every list, then the direction.
  const sign = dir === "asc" ? -1 : 1;
  const by = <T,>(name: (x: T) => string, amount: (x: T) => number, next?: (x: T) => string) => (a: T, b: T) =>
    sign * (sort === "name" ? name(b).localeCompare(name(a)) : sort === "next" && next ? next(b).localeCompare(next(a)) : amount(b) - amount(a));
  const accounts = [...data.accounts].sort(by((a) => a.name, (a) => a.balance));
  const investments = [...data.investments].sort(by((i) => i.instrument.name, (i) => i.value ?? 0));
  const recurring = [...data.recurringExpenses].sort(by((e) => e.name, (e) => e.monthlyAmount, (e) => e.nextChargeDate ?? "9999"));
  const debts = recurring.filter((e) => e.kind === "DEBT");
  const periodic = recurring.filter((e) => e.kind !== "DEBT");

  const main = data.netWorth.totals.find((x) => x.currency === me.currency) ?? data.netWorth.totals[0];
  const currency = main?.currency ?? me.currency;
  // Free plan: investments are not part of the balance shown (the section is locked).
  const current = isPro ? (main?.current ?? 0) : (main?.accounts ?? 0);
  const outstanding = debts.filter((d) => d.currency === currency).reduce((s, d) => s + (d.outstandingAmount ?? 0), 0);
  const monthlyNet = periodic.concat(debts).filter((e) => e.currency === currency)
    .reduce((s, e) => s + (e.direction === "INCOME" ? 1 : -1) * e.monthlyAmount, 0);
  const bankAccounts = data.accounts.filter((a) => a.kind !== "CASH").length;
  const counts = { all: data.accounts.length + data.investments.length + data.recurringExpenses.length, accounts: data.accounts.length, investments: data.investments.length, debts: debts.length, recurring: periodic.length };
  const shows = (v: (typeof VIEWS)[number]) => view === "all" || view === v;

  const empty = counts.all === 0;
  if (empty) {
    return (
      <>
        <PageNotice {...notice} />
        <EmptyState
          figure={money(0, me.currency)}
          title={t("empty.title")}
          text={t("empty.text")}
          actions={!me.readOnly && (
            <>
              <AddAccount back={back} currency={me.currency} readOnly={me.readOnly} primary />
              {isPro && <EmptyAction href="#investments" secondary>{t("addInvestment")}</EmptyAction>}
            </>
          )}
        />
      </>
    );
  }

  return (
    <>
      <PageNotice {...notice} />

      {!isPro && bankAccounts >= FREE_BANK_ACCOUNTS && (
        <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warn bg-warn-bg px-5 py-4 text-[15px] text-warn-ink">
          <span className="flex items-center gap-2.5"><TriangleAlert size={18} aria-hidden />{t("freeLimit")}</span>
          <Link href={`${base}/settings?tab=plan`} className="font-semibold text-warn-ink underline">{t("upgrade")}</Link>
        </div>
      )}

      <section aria-label={t("currentLabel")} className="flex flex-col gap-6 rounded-[24px] bg-band p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-ink-muted">{t("currentLabel")}</span>
            <span className="font-mono text-[44px] font-medium leading-none tracking-[-0.05em] tabular-nums sm:text-[64px]">{money(current, currency)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl bg-field px-4 py-3">
              <span className="text-[13px] text-ink-muted">{t("endOfMonth")}</span>
              <span className="font-mono text-lg tabular-nums">{money(main?.endOfMonth ?? 0, currency)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-field px-4 py-3">
              <span className="text-[13px] text-ink-muted">{t("afterDebtsShort")}</span>
              <span className={`font-mono text-lg tabular-nums ${(main?.total ?? 0) < 0 ? "text-debt-ink" : ""}`}>{money(main?.total ?? 0, currency)}</span>
            </div>
          </div>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {([
            ["accounts", main?.accounts ?? 0, "bg-s1", ""],
            ["investments", isPro ? (main?.investments ?? 0) : 0, "bg-leaf", ""],
            ["debts", -outstanding, "bg-debt", "text-debt-ink"],
            ["monthlyNet", monthlyNet, "bg-s2", monthlyNet >= 0 ? "text-leaf" : "text-debt-ink"],
          ] as const).map(([key, value, dot, tone]) => (
            <div key={key} className="flex flex-col gap-2 rounded-[18px] bg-field p-4">
              <dt className="flex items-center gap-2 text-[13px] text-ink-muted"><span className={`block size-2.5 rounded-full ${dot}`} />{t(`totals.${key}`)}</dt>
              <dd className={`m-0 font-mono text-xl tabular-nums ${tone}`}>{key === "monthlyNet" && value > 0 ? "+" : ""}{money(value, currency)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Filter bar: view chips with counts, sort and direction. Plain links/GET, so the URL is shareable. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t("filters.view")} className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-band p-1 sm:flex-wrap">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={url({ view: v })}
              aria-current={view === v ? "page" : undefined}
              className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm text-ink-muted hover:text-ink hover:no-underline aria-[current=page]:bg-field aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:shadow-soft"
            >
              {t(`views.${v}`)}
              <span className="rounded-full bg-paper px-1.5 font-mono text-[11px] text-ink-muted">{counts[v]}</span>
            </Link>
          ))}
        </nav>
        <form action={PAGE} className="flex items-center gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <input type="hidden" name="dir" value={dir} />
          <label className="sr-only" htmlFor="sort">{t("filters.sort")}</label>
          <select id="sort" name="sort" defaultValue={sort} className="h-10 rounded-[10px] border border-control bg-field px-3 font-sans text-sm text-ink">
            {SORTS.map((s) => <option key={s} value={s}>{t(`filters.sorts.${s}`)}</option>)}
          </select>
          <button className="h-10 cursor-pointer rounded-[10px] border border-control bg-field px-3 font-sans text-sm text-ink">{t("filters.apply")}</button>
          <Link
            href={url({ dir: dir === "desc" ? "asc" : "desc" })}
            aria-label={dir === "desc" ? t("filters.desc") : t("filters.asc")}
            title={dir === "desc" ? t("filters.desc") : t("filters.asc")}
            className="flex size-10 items-center justify-center rounded-[10px] border border-control bg-field text-ink hover:no-underline"
          >
            {dir === "desc" ? <ArrowDownWideNarrow size={18} aria-hidden /> : <ArrowUpNarrowWide size={18} aria-hidden />}
          </Link>
        </form>
      </div>

      {shows("accounts") && (
        <Section id="accounts" title={t("accounts")} aside={<AddAccount back={back} currency={me.currency} readOnly={me.readOnly} />}>
          <AccountList accounts={accounts} back={back} readOnly={me.readOnly} />
        </Section>
      )}

      {shows("investments") && (
        <Section id="investments" title={t("investments")}>
          {isPro ? (
            <>
              <InvestmentList investments={investments} back={back} readOnly={me.readOnly} />
              <InvestmentSearch action={PAGE} query={q} results={search.results} error={search.error} back={back} readOnly={me.readOnly} />
              <p className="m-0 text-[13px] text-ink-muted">{t("pricesSource")}</p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-2xl bg-band p-6">
              <span className="flex size-11 items-center justify-center rounded-control bg-field text-ink-muted"><Lock size={18} aria-hidden /></span>
              <span className="text-base font-semibold">{pro("investments.title")}</span>
              <p className="m-0 max-w-[520px] text-[15px] text-ink-muted">{pro("investments.text")}</p>
              <Link href={`${base}/settings?tab=plan`} className={primaryBtn}>{pro("upgrade")}</Link>
            </div>
          )}
        </Section>
      )}

      {shows("debts") && (
        <Section id="debts" title={t("debts")} aside={<AddExpense back={back} accounts={data.accounts} categories={data.categories} readOnly={me.readOnly} />}>
          <ExpenseList expenses={debts} back={back} readOnly={me.readOnly} categories={data.categories} accounts={data.accounts} />
        </Section>
      )}

      {shows("recurring") && (
        <Section id="recurring" title={t("recurringAll")} aside={<AddExpense back={back} accounts={data.accounts} categories={data.categories} readOnly={me.readOnly} />}>
          <ExpenseList expenses={periodic} back={back} readOnly={me.readOnly} categories={data.categories} accounts={data.accounts} />
        </Section>
      )}
    </>
  );
}
