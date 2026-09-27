import { getFormatter, getTranslations } from "next-intl/server";
import {
  ACCOUNT_FIELDS, AccountList, AddAccount, AddExpense, EXPENSE_FIELDS, EXPENSE_KINDS, ExpenseList, INCOME_KINDS, INVESTMENT_FIELDS,
  InvestmentList, InvestmentSearch, searchInstruments, type Account, type Category, type Expense, type Investment,
} from "@/components/app/finance";
import { EmptyAction, EmptyState, ListControls, PageHeader, PageNotice, Section, pick } from "@/components/app/ui";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Totals = { currency: string; accounts: number; investments: number; debts: number; current: number; endOfMonth: number; total: number };

const PAGE = "/dashboard/net-worth";
const SORTS = ["amount", "name", "next"] as const;
const KINDS = [...EXPENSE_KINDS, ...INCOME_KINDS] as const;

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("netWorth") };
}

export default async function NetWorthPage({ searchParams }: PageProps<"/dashboard/net-worth">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort = pick(sp.sort, SORTS);
  const kind = pick(sp.kind, KINDS);
  const [t, finance, format, notice, search, data] = await Promise.all([
    getTranslations("app.netWorth"),
    getTranslations("app.finance"),
    getFormatter(),
    appNotice(sp as { error?: string; message?: string }),
    searchInstruments(q),
    gql<{ me: { currency: string; readOnly: boolean }; netWorth: { totals: Totals[] }; accounts: Account[]; investments: Investment[]; recurringExpenses: Expense[]; categories: Category[] }>(`{
      me { currency readOnly }
      netWorth { totals { currency accounts investments debts current endOfMonth total } }
      accounts { ${ACCOUNT_FIELDS} }
      investments { ${INVESTMENT_FIELDS} }
      recurringExpenses { ${EXPENSE_FIELDS} }
      categories { id name }
    }`),
  ]);
  const { me } = data;
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const params = new URLSearchParams(Object.entries({ q, sort, kind }).filter(([, v]) => v) as [string, string][]);
  const back = params.size ? `${PAGE}?${params}` : PAGE;

  // Sorting is the same for every list: by amount (default), name or next date.
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  const accounts = [...data.accounts].sort(sort === "name" ? byName : (a, b) => b.balance - a.balance);
  const investments = [...data.investments].sort(
    sort === "name" ? (a, b) => a.instrument.name.localeCompare(b.instrument.name) : (a, b) => (b.value ?? 0) - (a.value ?? 0),
  );
  const recurring = data.recurringExpenses
    .filter((e) => !kind || e.kind === kind)
    .sort(
      sort === "name" ? byName
        : sort === "next" ? (a, b) => (a.nextChargeDate ?? "9999").localeCompare(b.nextChargeDate ?? "9999")
        : (a, b) => b.monthlyAmount - a.monthlyAmount,
    );
  const debts = recurring.filter((e) => e.kind === "DEBT");
  const expenses = recurring.filter((e) => e.direction === "EXPENSE" && e.kind !== "DEBT");
  const income = recurring.filter((e) => e.direction === "INCOME");

  const empty = data.accounts.length === 0 && data.investments.length === 0 && data.recurringExpenses.length === 0;
  const all = { value: "", label: t("filters.all") };

  return (
    <>
      <PageHeader title={t("title")} />
      <PageNotice {...notice} />

      {empty ? (
        <EmptyState
          figure={money(0, me.currency)}
          title={t("empty.title")}
          text={t("empty.text")}
          actions={!me.readOnly && (
            <>
              <AddAccount back={back} currency={me.currency} readOnly={me.readOnly} primary />
              <EmptyAction href="#investments" secondary>{t("addInvestment")}</EmptyAction>
            </>
          )}
        />
      ) : (
        data.netWorth.totals.map((row) => {
          const parts = [
            { key: "accounts", value: row.accounts, color: "bg-s1" },
            { key: "investments", value: row.investments, color: "bg-leaf" },
          ] as const;
          return (
            <section key={row.currency} aria-label={t("current", { currency: row.currency })} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <div className="font-mono text-xs tracking-[0.06em] text-ink-muted">{t("current", { currency: row.currency })}</div>
                <div className="font-mono text-[40px] font-medium leading-none tracking-[-0.05em] tabular-nums sm:text-[64px] xl:text-[80px]">
                  {money(row.current, row.currency)}
                </div>
              </div>
              {row.current > 0 && (
                <div className="flex h-3.5 gap-[3px]" aria-hidden="true">
                  {parts.filter((p) => p.value > 0).map((p) => <div key={p.key} className={p.color} style={{ flexGrow: p.value }} />)}
                </div>
              )}
              <dl className="m-0 grid grid-cols-1 border-t-[3px] border-ink sm:grid-cols-2 xl:grid-cols-4">
                {parts.map((p) => (
                  <div key={p.key} className="flex flex-col gap-2 py-5 pr-6 sm:border-r sm:border-rule">
                    <dt className="flex items-center gap-2.5 text-[15px]"><span className={`block size-2.5 ${p.color}`} />{t(p.key)}</dt>
                    <dd className="m-0 font-mono text-2xl tracking-[-0.03em] tabular-nums">{money(p.value, row.currency)}</dd>
                  </div>
                ))}
                <div className="flex flex-col gap-2 py-5 pr-6 sm:border-r sm:border-rule xl:pl-6">
                  <dt className="text-[13px] text-ink-muted">{t("endOfMonth")}</dt>
                  <dd className="m-0 font-mono text-lg tabular-nums text-ink-muted">{money(row.endOfMonth, row.currency)}</dd>
                </div>
                <div className="flex flex-col gap-2 py-5 xl:pl-6">
                  <dt className="text-[13px] text-ink-muted">{t("afterDebts", { debts: money(row.debts, row.currency) })}</dt>
                  <dd className={`m-0 font-mono text-lg tabular-nums ${row.total < 0 ? "text-danger-ink" : "text-ink-muted"}`}>{money(row.total, row.currency)}</dd>
                </div>
              </dl>
            </section>
          );
        })
      )}

      {!empty && (
        <ListControls
          action={PAGE}
          apply={t("filters.apply")}
          reset={t("filters.reset")}
          keep={q ? { q } : {}}
          controls={[
            { name: "kind", label: t("filters.kind"), value: kind, options: [all, ...KINDS.map((k) => ({ value: k, label: finance(`expenseKinds.${k}`) }))] },
            { name: "sort", label: t("filters.sort"), value: sort, options: [{ value: "", label: t("filters.sorts.amount") }, { value: "name", label: t("filters.sorts.name") }, { value: "next", label: t("filters.sorts.next") }] },
          ]}
        />
      )}

      <Section id="accounts" title={t("accounts")} aside={<AddAccount back={back} currency={me.currency} readOnly={me.readOnly} />}>
        <AccountList accounts={accounts} back={back} readOnly={me.readOnly} />
      </Section>

      <Section id="investments" title={t("investments")}>
        <InvestmentList investments={investments} back={back} readOnly={me.readOnly} />
        <InvestmentSearch action={PAGE} query={q} results={search.results} error={search.error} back={back} readOnly={me.readOnly} />
        <p className="m-0 text-[13px] text-ink-muted">{t("pricesSource")}</p>
      </Section>

      {(!kind || kind === "DEBT") && (
        <Section id="debts" title={t("debts")} aside={<AddExpense back={back} accounts={data.accounts} categories={data.categories} readOnly={me.readOnly} />}>
          <ExpenseList expenses={debts} back={back} readOnly={me.readOnly} categories={data.categories} accounts={data.accounts} />
        </Section>
      )}

      {(!kind || (EXPENSE_KINDS as readonly string[]).includes(kind)) && kind !== "DEBT" && (
        <Section id="recurring" title={t("recurring")} aside={<AddExpense back={back} accounts={data.accounts} categories={data.categories} readOnly={me.readOnly} />}>
          <ExpenseList expenses={expenses} back={back} readOnly={me.readOnly} categories={data.categories} accounts={data.accounts} />
        </Section>
      )}

      {(!kind || (INCOME_KINDS as readonly string[]).includes(kind)) && (
        <Section id="income" title={t("income")} aside={<AddExpense back={back} accounts={data.accounts} categories={data.categories} readOnly={me.readOnly} />}>
          <ExpenseList expenses={income} back={back} readOnly={me.readOnly} categories={data.categories} accounts={data.accounts} />
        </Section>
      )}

    </>
  );
}
