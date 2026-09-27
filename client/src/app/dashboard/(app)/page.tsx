import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { EXPENSE_FIELDS, type Expense } from "@/components/app/finance";
import { Empty, EmptyAction, EmptyState, PageHeader, PageNotice, Section, secondaryBtn, textLink } from "@/components/app/ui";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Totals = { currency: string; accounts: number; investments: number; debts: number; current: number; endOfMonth: number; total: number };
type Tx = { id: string; type: "INCOME" | "EXPENSE"; amount: number; currency: string; occurredOn: string; note: string | null; category: { name: string } | null; accountId: string | null };
type Account = { id: string; name: string; balance: number; currency: string };

const SERIES = ["bg-s1", "bg-s2", "bg-s3", "bg-s4"];

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("home") };
}

export default async function HomePage({ searchParams }: PageProps<"/dashboard">) {
  const [t, nav, format, notice] = await Promise.all([getTranslations("app.home"), getTranslations("app.nav"), getFormatter(), appNotice(await searchParams)]);
  const data = await gql<{
    me: { currency: string; readOnly: boolean };
    netWorth: { totals: Totals[] };
    transactions: Tx[];
    upcomingPayments: Expense[];
    accounts: Account[];
  }>(`{
    me { currency readOnly }
    netWorth { totals { currency accounts investments debts current endOfMonth total } }
    transactions(limit: 6) { id type amount currency occurredOn note category { name } accountId }
    upcomingPayments(days: 30) { ${EXPENSE_FIELDS} }
    accounts { id name balance currency }
  }`);

  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const signed = (tx: Tx) => `${tx.type === "INCOME" ? "+" : "−"}${money(tx.amount, tx.currency)}`;
  const day = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short" });
  const today = format.dateTime(new Date(), { day: "numeric", month: "short", year: "numeric" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const main = data.netWorth.totals.find((x) => x.currency === data.me.currency) ?? data.netWorth.totals[0];
  const currency = main?.currency ?? data.me.currency;
  const accounts = data.accounts.filter((a) => a.currency === currency).sort((a, b) => b.balance - a.balance);
  const positive = accounts.reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
  const upcomingTotal = data.upcomingPayments.filter((p) => p.currency === currency).reduce((s, p) => s + p.amount, 0);

  const header = (
    <PageHeader title={nav("home")} meta={today}>
      {!data.me.readOnly && <Link href="/dashboard/transactions" className={`${secondaryBtn} h-11`}>{t("newTransaction")}</Link>}
    </PageHeader>
  );

  if (data.accounts.length === 0 && data.transactions.length === 0) {
    return (
      <>
        {header}
        <PageNotice {...notice} />
        <EmptyState
          figure={money(0, data.me.currency)}
          title={t("empty.title")}
          text={t("empty.text")}
          actions={!data.me.readOnly && <EmptyAction href="/dashboard/net-worth#add-account">{t("empty.cta")}</EmptyAction>}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <PageNotice {...notice} />

      <section aria-label={t("currentLabel")} className="grid grid-cols-1 items-end gap-10 bg-band p-6 sm:px-10 sm:py-9 xl:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-3.5">
          <div className="font-mono text-xs tracking-[0.06em] text-ink-muted">{t("currentLabel")}</div>
          <div className="font-mono text-[40px] font-medium leading-none tracking-[-0.05em] tabular-nums sm:text-[72px] 2xl:text-[88px]">
            {money(main?.current ?? 0, currency)}
          </div>
          <div className="font-mono text-[13px] text-ink-muted">
            {t("currentSplit", { accounts: money(main?.accounts ?? 0, currency), investments: money(main?.investments ?? 0, currency) })}
          </div>
          {/* Projections stay discreet: the headline is what you have today. */}
          <dl className="m-0 mt-2 flex flex-wrap gap-x-8 gap-y-2 border-t border-rule pt-3">
            <div className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-ink-muted">{t("endOfMonth")}</dt>
              <dd className="m-0 font-mono text-base tabular-nums">{money(main?.endOfMonth ?? 0, currency)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-ink-muted">{t("afterDebts")}</dt>
              <dd className={`m-0 font-mono text-base tabular-nums ${(main?.total ?? 0) < 0 ? "text-danger-ink" : ""}`}>{money(main?.total ?? 0, currency)}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col gap-3.5">
          {positive > 0 && (
            <div className="flex h-3 gap-[3px]" aria-hidden="true">
              {accounts.filter((a) => a.balance > 0).slice(0, 4).map((a, i) => (
                <div key={a.id} className={SERIES[i]} style={{ flexGrow: a.balance }} />
              ))}
            </div>
          )}
          {accounts.slice(0, 4).map((a, i) => (
            <div key={a.id} className="flex items-center justify-between gap-4 text-[15px]">
              <span className="flex items-center gap-2.5"><span className={`block size-2.5 ${SERIES[i]}`} />{a.name}</span>
              <span className="font-mono tabular-nums">{money(a.balance, a.currency)}</span>
            </div>
          ))}
          <Link href="/dashboard/net-worth" className="flex justify-between border-t border-rule pt-2.5 text-[15px] text-ink hover:no-underline">
            <span>{t("seeNetWorth")}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[3fr_2fr]">
        <Section title={t("latest")} aside={<Link href="/dashboard/transactions" className={textLink}>{t("seeAll")}</Link>}>
          {data.transactions.length === 0 ? (
            <Empty>{t("noTransactions")}</Empty>
          ) : (
            <ul className="-mt-4 flex list-none flex-col p-0">
              {data.transactions.map((tx) => (
                <li key={tx.id} className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-rule">
                  <div className="flex flex-col gap-[3px]">
                    <span className="text-base font-semibold">{tx.note ?? tx.category?.name ?? t(tx.type === "INCOME" ? "income" : "expense")}</span>
                    <span className="text-[13px] text-ink-muted">
                      {[tx.accountId && accountName.get(tx.accountId), tx.category?.name, day(tx.occurredOn)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <span className={`font-mono text-base tabular-nums ${tx.type === "INCOME" ? "text-leaf" : ""}`}>{signed(tx)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("upcoming")} aside={<span className="font-mono text-[13px] text-ink-muted">{t("next30", { total: money(upcomingTotal, currency) })}</span>}>
          {data.upcomingPayments.length === 0 ? (
            <Empty>{t("noUpcoming")}</Empty>
          ) : (
            <ul className="-mt-4 flex list-none flex-col p-0">
              {data.upcomingPayments.map((p) => {
                const date = new Date(`${p.nextChargeDate}T00:00:00`);
                return (
                  <li key={p.id} className="grid min-h-16 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-rule">
                    <div className="flex h-12 flex-col items-center justify-center border border-ink font-mono leading-[1.05]" aria-hidden="true">
                      <span className="text-[17px] font-medium">{date.getDate()}</span>
                      <span className="text-[10px] uppercase tracking-[0.06em] text-ink-muted">{format.dateTime(date, { month: "short" }).replace(".", "")}</span>
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      <span className="text-base font-semibold">{p.name}</span>
                      <span className="text-[13px] text-ink-muted">{day(p.nextChargeDate!)} · {t(`kinds.${p.kind}`)}</span>
                    </div>
                    <span className="font-mono text-base tabular-nums">{money(p.amount, p.currency)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
