import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { EXPENSE_FIELDS, type Expense } from "@/components/app/finance";
import { Empty, List, PageHeader, PageNotice, Row, Section } from "@/components/app/ui";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Totals = { currency: string; accounts: number; investments: number; debts: number; total: number };
type Tx = { id: string; type: "INCOME" | "EXPENSE"; amount: number; currency: string; occurredOn: string; note: string | null; category: { name: string } | null; accountId: string | null };

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("home") };
}

export default async function HomePage({ searchParams }: PageProps<"/dashboard">) {
  const [t, format, notice] = await Promise.all([getTranslations("app.home"), getFormatter(), appNotice(await searchParams)]);
  const data = await gql<{
    me: { currency: string; displayName: string | null; fullName: string | null };
    netWorth: { totals: Totals[] };
    transactions: Tx[];
    upcomingPayments: Expense[];
    accounts: { id: string; name: string }[];
  }>(`{
    me { currency displayName fullName }
    netWorth { totals { currency accounts investments debts total } }
    transactions(limit: 8) { id type amount currency occurredOn note category { name } accountId }
    upcomingPayments(days: 30) { ${EXPENSE_FIELDS} }
    accounts { id name }
  }`);

  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const date = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  // Main currency first; others are listed below it (amounts are never converted).
  const totals = [...data.netWorth.totals].sort((a, b) => Number(b.currency === data.me.currency) - Number(a.currency === data.me.currency));
  const main = totals[0] ?? { currency: data.me.currency, accounts: 0, investments: 0, debts: 0, total: 0 };
  const name = data.me.displayName ?? data.me.fullName?.split(" ")[0];

  return (
    <>
      <PageHeader kicker={t("kicker")} title={name ? t("hello", { name }) : t("helloAnon")}>
        <Link href="/dashboard/transactions" className="btn inline-flex h-12 items-center self-start bg-brand px-6 text-[15px] font-semibold text-cream hover:no-underline sm:self-auto">
          {t("newTransaction")}
        </Link>
      </PageHeader>
      <PageNotice {...notice} />

      <section className="flex flex-col gap-3 bg-brand p-6 text-cream sm:p-8" aria-label={t("totalLabel")}>
        <div className="font-mono text-xs tracking-[0.06em] text-mist">{t("totalLabel")}</div>
        <div className="font-mono text-5xl font-medium leading-none tracking-[-0.05em] sm:text-7xl">{money(main.total, main.currency)}</div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 font-mono text-[13px] text-mist">
          <span>{t("accounts")} {money(main.accounts, main.currency)}</span>
          <span>{t("investments")} {money(main.investments, main.currency)}</span>
          <span>{t("debts")} −{money(main.debts, main.currency)}</span>
        </div>
        {totals.slice(1).map((o) => (
          <div key={o.currency} className="font-mono text-sm text-mist">+ {money(o.total, o.currency)}</div>
        ))}
        <Link href="/dashboard/net-worth" className="self-start pt-2 text-sm font-semibold text-cream underline">{t("seeNetWorth")}</Link>
      </section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        <Section title={t("latest")} aside={<Link href="/dashboard/transactions" className="text-sm underline">{t("seeAll")}</Link>}>
          {data.transactions.length === 0 ? (
            <Empty>{t("noTransactions")}</Empty>
          ) : (
            <List>
              {data.transactions.map((tx) => (
                <Row
                  key={tx.id}
                  title={tx.note ?? tx.category?.name ?? t(tx.type === "INCOME" ? "income" : "expense")}
                  meta={[date(tx.occurredOn), tx.category?.name, tx.accountId && accountName.get(tx.accountId)].filter(Boolean).join(" · ")}
                  value={<span className={tx.type === "INCOME" ? "text-leaf" : ""}>{tx.type === "INCOME" ? "+" : "−"}{money(tx.amount, tx.currency)}</span>}
                />
              ))}
            </List>
          )}
        </Section>

        <Section title={t("upcoming")} aside={<span className="font-mono text-xs text-ink-muted">{t("next30")}</span>}>
          {data.upcomingPayments.length === 0 ? (
            <Empty>{t("noUpcoming")}</Empty>
          ) : (
            <List>
              {data.upcomingPayments.map((p) => (
                <Row key={p.id} title={p.name} meta={date(p.nextChargeDate)} value={money(p.amount, p.currency)} />
              ))}
            </List>
          )}
        </Section>
      </div>
    </>
  );
}
