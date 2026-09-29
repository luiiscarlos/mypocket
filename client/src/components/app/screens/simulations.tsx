import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { deleteSimulation, saveSimulation } from "@/app/dashboard/actions";
import { Empty, List, PageHeader, PageNotice, Row, Section, dangerLink, smallButton } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";
import { ApiError, gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

// Parameters per calculator with sensible defaults (same names as the API's Zod schemas).
const KINDS = {
  MORTGAGE: { price: 250000, downPayment: 50000, annualRate: 3, years: 30 },
  LOAN: { amount: 12000, annualRate: 7, years: 5 },
  MONTHLY_INVESTMENT: { initial: 1000, monthly: 200, annualReturn: 6, years: 20 },
  INFLATION: { amount: 1000, annualInflation: 3, years: 10 },
  CAR: { price: 22000, downPayment: 5000, annualRate: 6, years: 5, yearlyCosts: 1500 },
  RETIREMENT: { currentAge: 30, retirementAge: 67, currentSavings: 10000, monthlyContribution: 300, annualReturn: 5, withdrawalRate: 4 },
} as const;
type Kind = keyof typeof KINDS;
type Result = { metrics: { key: string; value: number }[]; series: { period: number; value: number }[] };
type Saved = { id: string; name: string; kind: Kind; params: Record<string, number>; result: Result; createdAt: string };

// Metrics that are not money.
const PLAIN = new Set(["yearsToRetirement"]);
const PERCENT = new Set(["lossPercent"]);

export async function SimulationsScreen({ base, searchParams }: { base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const PAGE = `${base}/simulations`;

  const sp = await searchParams;
  const kind: Kind = typeof sp.kind === "string" && sp.kind in KINDS ? (sp.kind as Kind) : "MORTGAGE";
  const defaults = KINDS[kind] as Record<string, number>;
  // Values from the URL when the form was submitted; defaults otherwise.
  const params = Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => {
      const raw = typeof sp[k] === "string" ? Number((sp[k] as string).replace(",", ".")) : NaN;
      return [k, Number.isFinite(raw) ? raw : v];
    }),
  );

  const [t, format, notice, me, saved] = await Promise.all([
    getTranslations("app.simulations"),
    getFormatter(),
    appNotice(sp as { error?: string; message?: string }),
    gql<{ me: { currency: string; readOnly: boolean } }>("{ me { currency readOnly } }").then((d) => d.me),
    gql<{ simulations: Saved[] }>("{ simulations { id name kind params createdAt result { metrics { key value } } } }").then((d) => d.simulations),
  ]);
  let result: Result | undefined;
  let invalid = false;
  try {
    ({ simulate: result } = await gql<{ simulate: Result }>(
      "query ($k: SimulationKind!, $p: JSON!) { simulate(kind: $k, params: $p) { metrics { key value } series { period value } } }",
      { k: kind, p: params },
    ));
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    invalid = true;
  }

  const money = (v: number) => format.number(v, { style: "currency", currency: me.currency, maximumFractionDigits: 0 });
  const metric = (key: string, value: number) =>
    PLAIN.has(key) ? format.number(value) : PERCENT.has(key) ? `${format.number(value, { maximumFractionDigits: 1 })} %` : money(value);
  const maxSeries = Math.max(1, ...(result?.series.map((p) => p.value) ?? []));
  const back = `${PAGE}?${new URLSearchParams({ kind, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) })}`;
  const openLink = (s: Saved) => `${PAGE}?${new URLSearchParams({ kind: s.kind, ...Object.fromEntries(Object.entries(s.params).map(([k, v]) => [k, String(v)])) })}`;

  return (
    <>
      <PageHeader title={t("title")} />
      <PageNotice {...notice} />

      <nav aria-label={t("calculators")} className="flex flex-wrap gap-2">
        {(Object.keys(KINDS) as Kind[]).map((k) => (
          <Link
            key={k}
            href={`${PAGE}?kind=${k}`}
            aria-current={k === kind ? "page" : undefined}
            className="border border-ink px-4 py-2 text-sm font-semibold hover:no-underline aria-[current=page]:bg-ink aria-[current=page]:text-paper"
          >
            {t(`kinds.${k}`)}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_1.3fr]">
        <form action={PAGE} className="flex flex-col gap-4 border border-ink p-5">
          <input type="hidden" name="kind" value={kind} />
          <p className="m-0 text-[15px] text-ink-muted">{t(`descriptions.${kind}`)}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.keys(defaults).map((k) => (
              <label key={k} className={labelClass}>
                {t(`params.${k}` as "params.price")}
                <input name={k} inputMode="decimal" defaultValue={params[k]} required className={`${inputClass} font-mono`} />
              </label>
            ))}
          </div>
          <button className={`${smallButton} self-start`}>{t("calculate")}</button>
        </form>

        <Section title={t("result")}>
          {invalid || !result ? (
            <Empty>{t("invalid")}</Empty>
          ) : (
            <>
              <dl className="m-0 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {result.metrics.map((m) => (
                  <div key={m.key} className="flex flex-col gap-1 border-t border-ink pt-3">
                    <dt className="text-[13px] text-ink-muted">{t(`metrics.${m.key}` as "metrics.monthlyPayment")}</dt>
                    <dd className="m-0 font-mono text-lg">{metric(m.key, m.value)}</dd>
                  </div>
                ))}
              </dl>
              <figure className="m-0 flex flex-col gap-2">
                <div className="flex h-40 items-end gap-px" aria-hidden="true">
                  {result.series.map((p) => (
                    <div key={p.period} className="grow bg-sage" style={{ height: `${(p.value / maxSeries) * 100}%` }} title={`${p.period}: ${money(p.value)}`} />
                  ))}
                </div>
                <figcaption className="flex justify-between font-mono text-xs text-ink-muted">
                  <span>{t("yearN", { n: result.series[0]?.period ?? 0 })}</span>
                  <span>{t(`seriesLabel.${kind}`)}</span>
                  <span>{t("yearN", { n: result.series.at(-1)?.period ?? 0 })}</span>
                </figcaption>
              </figure>
              <p className="m-0 text-[13px] text-ink-muted">{t("disclaimer")}</p>
              {!me.readOnly && <form action={saveSimulation} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="params" value={JSON.stringify(params)} />
                <label className={`${labelClass} grow`}>
                  {t("saveName")}
                  <input name="name" required maxLength={80} placeholder={t(`kinds.${kind}`)} className={inputClass} />
                </label>
                <button className={`${smallButton} h-[52px]`}>{t("save")}</button>
              </form>}
            </>
          )}
        </Section>
      </div>

      <Section title={t("saved")} aside={<span className="font-mono text-[13px] text-ink-muted">{saved.length}</span>}>
        {saved.length === 0 ? (
          <Empty>{t("noSaved")}</Empty>
        ) : (
          <List>
            {saved.map((s) => {
              const first = s.result.metrics[0];
              return (
                <Row
                  key={s.id}
                  title={<Link href={openLink(s)}>{s.name}</Link>}
                  meta={`${t(`kinds.${s.kind}`)} · ${format.dateTime(new Date(s.createdAt), { day: "numeric", month: "short", year: "numeric" })}`}
                  value={first && metric(first.key, first.value)}
                  sub={first && t(`metrics.${first.key}` as "metrics.monthlyPayment")}
                >
                  {!me.readOnly && (
                    <form action={deleteSimulation}>
                      <input type="hidden" name="back" value={back} />
                      <input type="hidden" name="id" value={s.id} />
                      <button className={dangerLink}>{t("delete")}</button>
                    </form>
                  )}
                </Row>
              );
            })}
          </List>
        )}
      </Section>
    </>
  );
}
