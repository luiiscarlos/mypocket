import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Empty, EmptyAction, EmptyState, PageNotice } from "@/components/app/ui";
import { appNotice } from "@/lib/auth-codes";
import { getHome } from "@/lib/queries";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("home") };
}

const row = "grid min-h-[52px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3";
const initialBox = "flex size-10 items-center justify-center rounded-control bg-band text-sm font-bold text-ink-muted";

// Design "InicioMovil": balance block (36 px figure, composition bar, split), projections,
// upcoming payments and latest transactions as 52 px rows.
export default async function MobileHomePage({ searchParams }: PageProps<"/mobile">) {
  const [t, format, notice, data] = await Promise.all([getTranslations("app.home"), getFormatter(), appNotice(await searchParams), getHome()]);
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const day = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { weekday: "short", day: "numeric", month: "short" });
  const main = data.netWorth.totals.find((x) => x.currency === data.me.currency) ?? data.netWorth.totals[0];
  const currency = main?.currency ?? data.me.currency;
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const accounts = main?.accounts ?? 0;
  const investments = main?.investments ?? 0;

  if (data.accounts.length === 0 && data.transactions.length === 0) {
    return (
      <>
        <PageNotice {...notice} />
        <EmptyState
          figure={money(0, data.me.currency)}
          title={t("empty.title")}
          text={t("empty.text")}
          actions={!data.me.readOnly && <EmptyAction href="/mobile/net-worth">{t("empty.cta")}</EmptyAction>}
        />
      </>
    );
  }

  return (
    <>
      <PageNotice {...notice} />

      <section aria-label={t("currentLabel")} className="flex flex-col gap-2 rounded-[20px] bg-band p-5">
        <span className="text-[13px] text-ink-muted">{t("currentLabel")}</span>
        <span className="font-mono text-[36px] font-medium leading-none tracking-[-0.04em] tabular-nums">{money(main?.current ?? 0, currency)}</span>
        {accounts + investments > 0 && (
          <div className="mt-1.5 flex h-2 gap-[3px]" aria-hidden="true">
            {accounts > 0 && <div className="rounded-full bg-s1" style={{ flexGrow: accounts }} />}
            {investments > 0 && <div className="rounded-full bg-s2" style={{ flexGrow: investments }} />}
          </div>
        )}
        <span className="text-xs text-ink-muted">{t("currentSplit", { accounts: money(accounts, currency), investments: money(investments, currency) })}</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded-control bg-field px-3 py-2.5">
            <span className="text-xs text-ink-muted">{t("endOfMonth")}</span>
            <span className="font-mono text-[15px] tabular-nums">{money(main?.endOfMonth ?? 0, currency)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-control bg-field px-3 py-2.5">
            <span className="text-xs text-ink-muted">{t("afterDebts")}</span>
            <span className={`font-mono text-[15px] tabular-nums ${(main?.total ?? 0) < 0 ? "text-debt-ink" : ""}`}>{money(main?.total ?? 0, currency)}</span>
          </div>
        </div>
        <Link href="/mobile/net-worth" className="mt-1 flex items-center justify-between rounded-control bg-field px-3 py-2.5 text-sm font-semibold text-ink hover:no-underline">
          {t("seeNetWorth")}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="m-0 mb-1 text-[17px] font-bold">{t("upcoming")}</h2>
        {data.upcomingPayments.length === 0 ? (
          <Empty>{t("noUpcoming")}</Empty>
        ) : (
          data.upcomingPayments.map((p) => (
            <div key={p.id} className="grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-semibold">{p.name}</span>
                <span className="truncate text-xs text-ink-muted">{p.nextChargeDate && day(p.nextChargeDate)} · {t(`kinds.${p.kind}`)}</span>
              </div>
              <span className="font-mono text-[15px] tabular-nums">{money(p.amount, p.currency)}</span>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-1.5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="m-0 text-[17px] font-bold">{t("latest")}</h2>
          <Link href="/mobile/transactions" className="text-sm font-semibold text-ink underline">{t("seeAll")}</Link>
        </div>
        {data.transactions.length === 0 ? (
          <Empty>{t("noTransactions")}</Empty>
        ) : (
          data.transactions.map((tx) => {
            const title = tx.note ?? tx.category?.name ?? t(tx.type === "INCOME" ? "income" : "expense");
            return (
              <div key={tx.id} className={row}>
                <span aria-hidden="true" className={initialBox}>{title.charAt(0).toUpperCase()}</span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold">{title}</span>
                  <span className="truncate text-xs text-ink-muted">{[tx.accountId && accountName.get(tx.accountId), day(tx.occurredOn)].filter(Boolean).join(" · ")}</span>
                </div>
                <span className={`font-mono text-[15px] tabular-nums ${tx.type === "INCOME" ? "text-leaf" : ""}`}>
                  {tx.type === "INCOME" ? "+" : "−"}{money(tx.amount, tx.currency)}
                </span>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
