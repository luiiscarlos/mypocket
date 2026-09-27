import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { EXPENSE_FIELDS, type Expense } from "@/components/app/finance";
import { Empty, EmptyAction, EmptyState, PageNotice, Section, secondaryBtn, textLink } from "@/components/app/ui";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Totals = { currency: string; accounts: number; investments: number; debts: number; current: number; endOfMonth: number; total: number };
type Tx = { id: string; type: "INCOME" | "EXPENSE"; amount: number; currency: string; occurredOn: string; note: string | null; category: { name: string } | null; accountId: string | null };
type Account = { id: string; name: string; balance: number; currency: string };

const SERIES = ["bg-s1", "bg-s2", "bg-s3", "bg-s3"];
const square = "flex size-11 shrink-0 items-center justify-center rounded-control bg-band";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("home") };
}

// Design v3 "Inicio": beige balance block, two projection cards, composition bar and two list cards.
export default async function HomePage({ searchParams }: PageProps<"/dashboard">) {
  const [t, format, notice] = await Promise.all([getTranslations("app.home"), getFormatter(), appNotice(await searchParams)]);
  const data = await gql<{
    me: { currency: string; readOnly: boolean; plan: "FREE" | "PRO" };
    netWorth: { totals: Totals[] };
    transactions: Tx[];
    upcomingPayments: Expense[];
    accounts: Account[];
  }>(`{
    me { currency readOnly plan }
    netWorth { totals { currency accounts investments debts current endOfMonth total } }
    transactions(limit: 6) { id type amount currency occurredOn note category { name } accountId }
    upcomingPayments(days: 30) { ${EXPENSE_FIELDS} }
    accounts { id name balance currency }
  }`);

  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const signed = (tx: Tx) => `${tx.type === "INCOME" ? "+" : "−"}${money(tx.amount, tx.currency)}`;
  const day = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const main = data.netWorth.totals.find((x) => x.currency === data.me.currency) ?? data.netWorth.totals[0];
  const currency = main?.currency ?? data.me.currency;
  const accounts = data.accounts.filter((a) => a.currency === currency).sort((a, b) => b.balance - a.balance);
  const positive = accounts.reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
  const upcomingTotal = data.upcomingPayments.filter((p) => p.currency === currency).reduce((s, p) => s + p.amount, 0);

  if (data.accounts.length === 0 && data.transactions.length === 0) {
    return (
      <>
        <PageNotice {...notice} />
        <EmptyState
          figure={money(0, data.me.currency)}
          title={t("empty.title")}
          text={t("empty.text")}
          actions={!data.me.readOnly && <EmptyAction href="/dashboard/net-worth">{t("empty.cta")}</EmptyAction>}
        />
      </>
    );
  }

  return (
    <>
      <PageNotice {...notice} />

      <section aria-label={t("currentLabel")} className="grid grid-cols-1 gap-8 rounded-[24px] bg-band p-6 sm:p-8 xl:grid-cols-[3fr_2fr] xl:items-end">
        <div className="flex flex-col gap-4">
          <span className="text-[13px] font-semibold text-ink-muted">{t("currentLabel")}</span>
          <span className="font-mono text-[44px] font-medium leading-none tracking-[-0.05em] tabular-nums sm:text-[68px]">{money(main?.current ?? 0, currency)}</span>
          <span className="text-[13px] text-ink-muted">
            {t("currentSplit", { accounts: money(main?.accounts ?? 0, currency), investments: money(main?.investments ?? 0, currency) })}
          </span>
          {/* Projections stay secondary: the headline is what you have today. */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1 rounded-2xl bg-field px-4 py-3">
              <span className="text-[13px] text-ink-muted">{t("endOfMonth")}</span>
              <span className="font-mono text-lg tabular-nums">{money(main?.endOfMonth ?? 0, currency)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-field px-4 py-3">
              <span className="text-[13px] text-ink-muted">{t("afterDebts")}</span>
              <span className={`font-mono text-lg tabular-nums ${(main?.total ?? 0) < 0 ? "text-debt-ink" : ""}`}>{money(main?.total ?? 0, currency)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {positive > 0 && (
            <div className="flex h-3 gap-[3px] overflow-hidden rounded-full" aria-hidden="true">
              {accounts.filter((a) => a.balance > 0).slice(0, 4).map((a, i) => (
                <div key={a.id} className={SERIES[i]} style={{ flexGrow: a.balance }} />
              ))}
            </div>
          )}
          {accounts.slice(0, 4).map((a, i) => (
            <div key={a.id} className="flex items-center justify-between gap-4 text-[15px]">
              <span className="flex items-center gap-2.5"><span className={`block size-2.5 rounded-full ${SERIES[i]}`} />{a.name}</span>
              <span className="font-mono tabular-nums">{money(a.balance, a.currency)}</span>
            </div>
          ))}
          <Link href="/dashboard/net-worth" className="mt-1 flex items-center justify-between rounded-control bg-field px-4 py-2.5 text-[15px] font-semibold text-ink hover:no-underline">
            {t("seeNetWorth")}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Section title={t("latest")} aside={<Link href="/dashboard/transactions" className={textLink}>{t("seeAll")}</Link>}>
          {data.transactions.length === 0 ? (
            <Empty>{t("noTransactions")}</Empty>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {data.transactions.map((tx) => (
                <li key={tx.id} className="flex min-h-16 items-center gap-3.5 border-b border-rule py-2 last:border-b-0">
                  <span className={`${square} ${tx.type === "INCOME" ? "text-leaf" : "text-ink-muted"}`} aria-hidden="true">
                    {tx.type === "INCOME" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </span>
                  <div className="flex min-w-0 grow flex-col gap-[3px]">
                    <span className="truncate text-[15px] font-semibold">{tx.note ?? tx.category?.name ?? t(tx.type === "INCOME" ? "income" : "expense")}</span>
                    <span className="truncate text-[13px] text-ink-muted">
                      {[tx.accountId && accountName.get(tx.accountId), tx.category?.name, day(tx.occurredOn)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <span className={`font-mono text-[15px] tabular-nums ${tx.type === "INCOME" ? "text-leaf" : ""}`}>{signed(tx)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("upcoming")} aside={<span className="font-mono text-[13px] text-ink-muted">{t("next30", { total: money(upcomingTotal, currency) })}</span>}>
          {data.upcomingPayments.length === 0 ? (
            <Empty>{t("noUpcoming")}</Empty>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {data.upcomingPayments.map((p) => {
                const date = new Date(`${p.nextChargeDate}T00:00:00`);
                return (
                  <li key={p.id} className="flex min-h-16 items-center gap-3.5 border-b border-rule py-2 last:border-b-0">
                    <span className={`${square} flex-col font-mono leading-none`} aria-hidden="true">
                      <span className="text-base font-medium">{date.getDate()}</span>
                      <span className="text-[10px] uppercase tracking-[0.06em] text-ink-muted">{format.dateTime(date, { month: "short" }).replace(".", "")}</span>
                    </span>
                    <div className="flex min-w-0 grow flex-col gap-[3px]">
                      <span className="truncate text-[15px] font-semibold">{p.name}</span>
                      <span className="truncate text-[13px] text-ink-muted">
                        {t(`kinds.${p.kind}`)}
                        {p.endsOn && p.kind === "DEBT" ? ` · ${t("endsOn", { date: format.dateTime(new Date(`${p.endsOn}T00:00:00`), { month: "short", year: "numeric" }) })}` : ""}
                      </span>
                    </div>
                    <span className="font-mono text-[15px] tabular-nums">{money(p.amount, p.currency)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {!data.me.readOnly && (
        <Link href="/dashboard/transactions?new=1" className={`${secondaryBtn} self-start lg:hidden`}><Plus size={16} aria-hidden />{t("newTransaction")}</Link>
      )}
    </>
  );
}
