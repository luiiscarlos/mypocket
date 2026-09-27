import { getFormatter, getTranslations } from "next-intl/server";
import { createTransaction, deleteTransaction } from "@/app/dashboard/actions";
import { Empty, List, PageHeader, PageNotice, Row, Section, dangerLink } from "@/components/app/ui";
import { inputClass, labelClass, primaryButton } from "@/components/forms";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";

type Tx = { id: string; type: "INCOME" | "EXPENSE"; amount: number; currency: string; occurredOn: string; note: string | null; category: { name: string } | null; accountId: string | null };

const PAGE = "/dashboard/transactions";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("transactions") };
}

export default async function TransactionsPage({ searchParams }: PageProps<"/dashboard/transactions">) {
  const [t, format, notice, data] = await Promise.all([
    getTranslations("app.transactions"),
    getFormatter(),
    appNotice(await searchParams),
    gql<{ me: { currency: string; readOnly: boolean }; categories: { id: string; name: string }[]; accounts: { id: string; name: string; currency: string }[]; transactions: Tx[] }>(`{
      me { currency readOnly }
      categories { id name }
      accounts { id name currency }
      transactions(limit: 50) { id type amount currency occurredOn note category { name } accountId }
    }`),
  ]);
  const { me } = data;
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const date = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short", year: "numeric" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader kicker={t("kicker")} title={t("title")} />
      <PageNotice {...notice} />

      <form action={createTransaction} className="flex flex-col gap-5 border border-ink p-5 sm:p-6">
        <input type="hidden" name="back" value={PAGE} />
        <fieldset className="m-0 flex gap-6 border-0 p-0">
          <legend className="sr-only">{t("type")}</legend>
          {(["EXPENSE", "INCOME"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-base font-semibold">
              <input type="radio" name="type" value={type} defaultChecked={type === "EXPENSE"} className="size-5 accent-leaf" />
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
            {t("category")}
            <select name="categoryId" defaultValue="" className={`${inputClass} px-3`}>
              <option value="">{t("none")}</option>
              {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            {t("account")}
            <select name="accountId" defaultValue="" className={`${inputClass} px-3`}>
              <option value="">{t("none")}</option>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          {t("note")}
          <input name="note" maxLength={200} placeholder={t("notePlaceholder")} className={inputClass} />
        </label>
        <p className="m-0 text-[13px] text-ink-muted">{t("balanceHint")}</p>
        <button disabled={me.readOnly} className={`${primaryButton} sm:w-auto sm:self-start`}>{t("save")}</button>
      </form>

      <Section title={t("history")}>
        {data.transactions.length === 0 ? (
          <Empty>{t("empty")}</Empty>
        ) : (
          <List>
            {data.transactions.map((tx) => (
              <Row
                key={tx.id}
                title={tx.note ?? tx.category?.name ?? t(tx.type)}
                meta={[date(tx.occurredOn), tx.category?.name, tx.accountId && accountName.get(tx.accountId)].filter(Boolean).join(" · ")}
                value={<span className={tx.type === "INCOME" ? "text-leaf" : ""}>{tx.type === "INCOME" ? "+" : "−"}{money(tx.amount, tx.currency)}</span>}
              >
                <form action={deleteTransaction}>
                  <input type="hidden" name="back" value={PAGE} />
                  <input type="hidden" name="id" value={tx.id} />
                  <button disabled={me.readOnly} className={dangerLink}>{t("delete")}</button>
                </form>
              </Row>
            ))}
          </List>
        )}
      </Section>
    </>
  );
}
