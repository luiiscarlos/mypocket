import { getFormatter, getTranslations } from "next-intl/server";
import {
  ACCOUNT_FIELDS, AccountForm, AccountList, EXPENSE_FIELDS, ExpenseForm, ExpenseList, INVESTMENT_FIELDS, InvestmentList,
  InvestmentSearch, searchInstruments, type Account, type Expense, type Instrument, type Investment,
} from "@/components/app/finance";
import { Bar, PageHeader, PageNotice, Section } from "@/components/app/ui";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Totals = { currency: string; accounts: number; investments: number; debts: number; total: number };

const PAGE = "/dashboard/net-worth";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("netWorth") };
}

export default async function NetWorthPage({ searchParams }: PageProps<"/dashboard/net-worth">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const [t, format, notice, search, data] = await Promise.all([
    getTranslations("app.netWorth"),
    getFormatter(),
    appNotice(params as { error?: string; message?: string }),
    searchInstruments(q),
    gql<{ me: { currency: string; readOnly: boolean }; netWorth: { totals: Totals[] }; accounts: Account[]; investments: Investment[]; recurringExpenses: Expense[] }>(`{
      me { currency readOnly }
      netWorth { totals { currency accounts investments debts total } }
      accounts { ${ACCOUNT_FIELDS} }
      investments { ${INVESTMENT_FIELDS} }
      recurringExpenses { ${EXPENSE_FIELDS} }
    }`),
  ]);
  const { me } = data;
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const back = q ? `${PAGE}?q=${encodeURIComponent(q)}` : PAGE;
  const debts = data.recurringExpenses.filter((e) => e.kind === "DEBT");
  const recurring = data.recurringExpenses.filter((e) => e.kind !== "DEBT");

  return (
    <>
      <PageHeader kicker={t("kicker")} title={t("title")} />
      <PageNotice {...notice} />

      {data.netWorth.totals.map((row) => {
        const max = Math.max(row.accounts, row.investments, row.debts);
        return (
          <section key={row.currency} className="grid grid-cols-1 gap-6 border border-ink p-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col gap-2">
              <div className="font-mono text-xs tracking-[0.06em] text-ink-muted">{t("total", { currency: row.currency })}</div>
              <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em]">{money(row.total, row.currency)}</div>
            </div>
            <dl className="m-0 flex flex-col gap-3">
              {(["accounts", "investments", "debts"] as const).map((k) => (
                <div key={k} className="grid grid-cols-[120px_1fr_auto] items-center gap-4">
                  <dt className="text-sm">{t(k)}</dt>
                  <dd className="m-0"><Bar value={row[k]} max={max} tone={k === "debts" ? "danger" : k === "investments" ? "sage" : "leaf"} /></dd>
                  <dd className="m-0 font-mono text-sm">{k === "debts" ? "−" : ""}{money(row[k], row.currency)}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      <Section title={t("accounts")}>
        <AccountList accounts={data.accounts} back={back} readOnly={me.readOnly} />
        <details className="group">
          <summary className="cursor-pointer text-[15px] font-semibold underline">{t("addAccount")}</summary>
          <div className="pt-4"><AccountForm back={back} currency={me.currency} readOnly={me.readOnly} /></div>
        </details>
      </Section>

      <Section title={t("investments")}>
        <InvestmentList investments={data.investments} back={back} readOnly={me.readOnly} />
        <InvestmentSearch action={PAGE} query={q} results={search.results} error={search.error} back={back} readOnly={me.readOnly} />
      </Section>

      <Section title={t("debts")}>
        <ExpenseList expenses={debts} back={back} readOnly={me.readOnly} />
      </Section>

      <Section title={t("recurring")}>
        <ExpenseList expenses={recurring} back={back} readOnly={me.readOnly} />
        <details>
          <summary className="cursor-pointer text-[15px] font-semibold underline">{t("addExpense")}</summary>
          <div className="pt-4"><ExpenseForm back={back} accounts={data.accounts} readOnly={me.readOnly} /></div>
        </details>
      </Section>
    </>
  );
}
