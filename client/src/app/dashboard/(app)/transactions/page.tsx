import { getFormatter, getTranslations } from "next-intl/server";
import { Trash2 } from "lucide-react";
import { createTransaction, deleteTransaction } from "@/app/dashboard/actions";
import { RecurringFields, type Category } from "@/components/app/finance";
import { Empty, List, ListControls, PageHeader, PageNotice, Row, Section, dangerLink, pick, primaryBtn } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Tx = { id: string; type: "INCOME" | "EXPENSE"; amount: number; currency: string; occurredOn: string; note: string | null; category: { name: string } | null; accountId: string | null };

const PAGE = "/dashboard/transactions";
const ORDERS = ["DATE_DESC", "DATE_ASC", "AMOUNT_DESC", "AMOUNT_ASC"] as const;
const TYPES = ["INCOME", "EXPENSE"] as const;
const isDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const isId = (v: unknown) => (typeof v === "string" && /^\d{1,18}$/.test(v) ? v : undefined);

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("transactions") };
}

export default async function TransactionsPage({ searchParams }: PageProps<"/dashboard/transactions">) {
  const sp = await searchParams;
  // Only known values reach the API; anything else in the URL is ignored.
  const filter = {
    type: pick(sp.type, TYPES),
    accountId: isId(sp.account),
    categoryId: isId(sp.category),
    from: isDate(sp.from),
    to: isDate(sp.to),
  };
  const orderBy = pick(sp.sort, ORDERS) ?? "DATE_DESC";

  const [t, format, notice, data] = await Promise.all([
    getTranslations("app.transactions"),
    getFormatter(),
    appNotice(sp as { error?: string; message?: string }),
    gql<{ me: { currency: string; readOnly: boolean }; categories: Category[]; accounts: { id: string; name: string; currency: string }[]; transactions: Tx[] }>(
      `query ($f: TransactionFilter, $o: TransactionOrder) {
        me { currency readOnly }
        categories { id name }
        accounts { id name currency }
        transactions(filter: $f, orderBy: $o, limit: 100) { id type amount currency occurredOn note category { name } accountId }
      }`,
      { f: filter, o: orderBy },
    ),
  ]);
  const { me } = data;
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const date = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short", year: "numeric" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const today = new Date().toISOString().slice(0, 10);
  const all = { value: "", label: t("filters.all") };

  return (
    <>
      <PageHeader title={t("title")} />
      <PageNotice {...notice} />

      {!me.readOnly && (
        <Section id="new" title={t("new")}>
          <form action={createTransaction} className="group/tx flex flex-col gap-5">
            <input type="hidden" name="back" value={PAGE} />
            <fieldset className="m-0 grid max-w-sm grid-cols-2 border border-ink p-0" role="radiogroup">
              <legend className="sr-only">{t("type")}</legend>
              {(["EXPENSE", "INCOME"] as const).map((type) => (
                <label key={type} className="flex h-12 cursor-pointer items-center justify-center text-[15px] font-semibold has-[:checked]:bg-leaf has-[:checked]:text-on-leaf has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
                  <input type="radio" name="type" value={type} defaultChecked={type === "EXPENSE"} className="sr-only" />
                  {t(type)}
                </label>
              ))}
            </fieldset>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <label className={labelClass}>
                  {t("amount")}
                  <input name="amount" inputMode="decimal" required placeholder="0,00" className={`${inputClass} font-mono`} />
                </label>
                <label className={labelClass}>
                  {t("currency")}
                  <input name="currency" defaultValue={me.currency} pattern="[A-Za-z]{3}" maxLength={3} required className={`${inputClass} font-mono uppercase`} />
                </label>
              </div>
              <label className={labelClass}>
                {t("date")}
                <input name="occurredOn" type="date" defaultValue={today} required className={`${inputClass} font-mono`} />
              </label>
              <label className={labelClass}>
                {t("account")}
                <select name="accountId" defaultValue="" className={`${inputClass} px-3`}>
                  <option value="">{t("none")}</option>
                  {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                {t("category")}
                <select name="categoryId" defaultValue="" className={`${inputClass} px-3`}>
                  <option value="">{t("none")}</option>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className={`${labelClass} sm:col-span-2 xl:col-span-4`}>
                {t("note")}
                <input name="note" maxLength={200} placeholder={t("notePlaceholder")} className={inputClass} />
              </label>
            </div>

            {/* Periodic: the switch reveals the schedule with CSS only (group-has), no client JS. */}
            <div className="flex flex-col gap-4 border-t border-rule pt-5">
              <label className="flex cursor-pointer items-center justify-between gap-4 sm:justify-start">
                <span className="flex flex-col">
                  <span className="text-base font-semibold">{t("periodic")}</span>
                  <span className="text-[13px] text-ink-muted">{t("periodicHint")}</span>
                </span>
                <input type="checkbox" name="periodic" role="switch" className="peer sr-only" />
                <span aria-hidden="true" className="relative h-7 w-[52px] shrink-0 border border-ink after:absolute after:left-[3px] after:top-[3px] after:size-5 after:bg-ink after:transition-transform peer-checked:border-leaf peer-checked:bg-leaf peer-checked:after:translate-x-6 peer-checked:after:bg-on-leaf peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-focus" />
              </label>
              <div className="hidden group-has-[[name=periodic]:checked]/tx:block">
                <RecurringFields categories={data.categories} startName="occurredOn" withCategory={false} />
              </div>
            </div>
            <p className="m-0 text-[13px] text-ink-muted">{t("balanceHint")}</p>
            <button className={`${primaryBtn} h-14 self-start px-8 text-base`}>{t("save")}</button>
          </form>
        </Section>
      )}

      <Section title={t("history")} aside={<span className="font-mono text-[13px] text-ink-muted">{t("count", { count: data.transactions.length })}</span>}>
        <ListControls
          action={PAGE}
          apply={t("filters.apply")}
          reset={t("filters.reset")}
          controls={[
            { name: "type", label: t("filters.type"), value: filter.type, options: [all, ...TYPES.map((v) => ({ value: v, label: t(v) }))] },
            { name: "account", label: t("filters.account"), value: filter.accountId, options: [all, ...data.accounts.map((a) => ({ value: a.id, label: a.name }))] },
            { name: "category", label: t("filters.category"), value: filter.categoryId, options: [all, ...data.categories.map((c) => ({ value: c.id, label: c.name }))] },
            { name: "from", label: t("filters.from"), value: filter.from, type: "date" },
            { name: "to", label: t("filters.to"), value: filter.to, type: "date" },
            { name: "sort", label: t("filters.sort"), value: orderBy === "DATE_DESC" ? undefined : orderBy, options: ORDERS.map((o) => ({ value: o === "DATE_DESC" ? "" : o, label: t(`filters.orders.${o}`) })) },
          ]}
        />
        {data.transactions.length === 0 ? (
          <Empty>{Object.values(filter).some(Boolean) ? t("noMatches") : t("empty")}</Empty>
        ) : (
          <List>
            {data.transactions.map((tx) => (
              <Row
                key={tx.id}
                title={tx.note ?? tx.category?.name ?? t(tx.type)}
                meta={[date(tx.occurredOn), tx.category?.name, tx.accountId && accountName.get(tx.accountId)].filter(Boolean).join(" · ")}
                value={<span className={tx.type === "INCOME" ? "text-leaf" : ""}>{tx.type === "INCOME" ? "+" : "−"}{money(tx.amount, tx.currency)}</span>}
              >
                {!me.readOnly && (
                  <form action={deleteTransaction}>
                    <input type="hidden" name="back" value={PAGE} />
                    <input type="hidden" name="id" value={tx.id} />
                    <button className={`${dangerLink} inline-flex items-center`} aria-label={t("delete")} title={t("delete")}><Trash2 size={16} aria-hidden /></button>
                  </form>
                )}
              </Row>
            ))}
          </List>
        )}
      </Section>
    </>
  );
}
