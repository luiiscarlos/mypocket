import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Bar, Empty, EmptyAction, EmptyState, List, PageHeader, ProUpsell, Section } from "@/components/app/ui";
import { getMonthlySummaries, getPlan, monthStart, type Summary } from "@/lib/queries";

const MONTHS = 6;

export async function AnalyticsScreen({ base, searchParams }: { base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { month } = await searchParams;
  const now = new Date();
  const months = Array.from({ length: MONTHS }, (_, i) => monthStart(now, MONTHS - 1 - i));
  const selected = typeof month === "string" && /^\d{4}-\d{2}$/.test(month) && months.includes(`${month}-01`) ? `${month}-01` : months.at(-1)!;

  // Analytics is a Pro feature: Free users get the upgrade state instead of a failing query.
  if ((await getPlan()) !== "PRO") {
    const [t, pro] = await Promise.all([getTranslations("app.analytics"), getTranslations("app.pro")]);
    return (
      <>
        <PageHeader title={t("title")} />
        <ProUpsell title={pro("analytics.title")} text={pro("analytics.text")} cta={pro("cta")} />
      </>
    );
  }

  const [t, format, { summaries, currency }] = await Promise.all([
    getTranslations("app.analytics"),
    getFormatter(),
    getMonthlySummaries(MONTHS),
  ]);
  const money = (v: number, c = currency) => format.number(v, { style: "currency", currency: c });
  const monthLabel = (ym: string) => format.dateTime(new Date(`${ym}-01T00:00:00`), { month: "short", year: "2-digit" });

  const inMain = (s: Summary) => s.totals.find((x) => x.currency === currency) ?? { income: 0, expense: 0, balance: 0 };
  const max = Math.max(1, ...summaries.flatMap((s) => [inMain(s).income, inMain(s).expense]));
  const current = summaries.find((s) => `${s.month}-01` === selected)!;
  const expenses = current.byCategory.filter((c) => c.type === "EXPENSE" && c.currency === currency).sort((a, b) => b.total - a.total);
  const maxCategory = Math.max(1, ...expenses.map((c) => c.total));
  const other = current.totals.filter((x) => x.currency !== currency);

  if (summaries.every((s) => s.isEmpty)) {
    return (
      <>
        <PageHeader title={t("title")} />
        <EmptyState title={t("emptyAll.title")} text={t("emptyAll.text")} actions={<EmptyAction href={`${base}/transactions?new=1`}>{t("emptyAll.cta")}</EmptyAction>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} />

      <Section title={t("byMonth", { currency })}>
        <div className="grid grid-cols-6 items-end gap-2 sm:gap-4" role="list">
          {summaries.map((s) => {
            const m = inMain(s);
            const active = `${s.month}-01` === selected;
            return (
              <Link
                key={s.month}
                role="listitem"
                href={`${base}/analytics?month=${s.month}`}
                aria-current={active ? "true" : undefined}
                aria-label={t("monthAria", { month: monthLabel(s.month), income: money(m.income), expense: money(m.expense) })}
                className="flex flex-col items-center gap-2 border-b-2 border-transparent pb-2 hover:no-underline aria-[current=true]:border-ink"
              >
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div className="w-3 bg-leaf sm:w-5" style={{ height: `${(m.income / max) * 100}%` }} />
                  <div className="w-3 bg-expense sm:w-5" style={{ height: `${(m.expense / max) * 100}%` }} />
                </div>
                <div className="font-mono text-xs text-ink-muted">{monthLabel(s.month)}</div>
              </Link>
            );
          })}
        </div>
        <div className="flex gap-6 font-mono text-xs text-ink-muted">
          <span className="flex items-center gap-2"><span className="size-2.5 bg-leaf" />{t("income")}</span>
          <span className="flex items-center gap-2"><span className="size-2.5 bg-expense" />{t("expense")}</span>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_1.4fr]">
        <Section title={monthLabel(current.month)}>
          <dl className="m-0 grid grid-cols-3 gap-4">
            {(["income", "expense", "balance"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1 border-t border-ink pt-3">
                <dt className="font-mono text-xs text-ink-muted">{t(k)}</dt>
                <dd className="m-0 font-mono text-lg">{money(inMain(current)[k])}</dd>
              </div>
            ))}
          </dl>
          {other.map((o) => (
            <p key={o.currency} className="m-0 font-mono text-sm text-ink-muted">
              {o.currency}: {t("income")} {money(o.income, o.currency)} · {t("expense")} {money(o.expense, o.currency)}
            </p>
          ))}
        </Section>

        <Section title={t("byCategory")}>
          {expenses.length === 0 ? (
            <Empty>{t("empty")}</Empty>
          ) : (
            <List>
              {expenses.map((c, i) => (
                <li key={i} className="flex flex-col gap-2 border-b border-rule py-3">
                  <div className="flex justify-between gap-4">
                    <span className="font-semibold">{c.category?.name ?? t("uncategorized")}</span>
                    <span className="font-mono">{money(c.total)} <span className="text-xs text-ink-muted">· {t("count", { count: c.count })}</span></span>
                  </div>
                  <Bar value={c.total} max={maxCategory} tone="s2" />
                </li>
              ))}
            </List>
          )}
        </Section>
      </div>
    </>
  );
}
