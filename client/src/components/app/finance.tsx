// Lists and forms for accounts, investments and recurring expenses. Shared by the onboarding and Net worth.
import { getFormatter, getTranslations } from "next-intl/server";
import { inputClass, labelClass } from "@/components/forms";
import { ApiError, gql } from "@/lib/api";
import { Empty, List, Row, dangerLink, smallButton } from "@/components/app/ui";
import {
  addInvestment,
  createAccount,
  createExpense,
  deleteAccount,
  deleteExpense,
  deleteInvestment,
  updateAccountBalance,
} from "@/app/dashboard/actions";

export type Account = { id: string; name: string; institution: string | null; kind: "CHECKING" | "SAVINGS" | "CASH"; currency: string; balance: number };
export type Instrument = { id: string; isin: string | null; symbol: string; name: string; kind: string; currency: string; exchange: string | null; lastPrice: number | null };
export type Investment = { id: string; quantity: number; value: number | null; currency: string; instrument: Instrument };
export type Expense = {
  id: string; name: string; kind: "SUBSCRIPTION" | "DEBT" | "OTHER"; amount: number; currency: string;
  intervalUnit: "WEEK" | "MONTH" | "YEAR"; nextChargeDate: string; outstandingAmount: number | null; monthlyAmount: number;
};

export const ACCOUNT_FIELDS = "id name institution kind currency balance";
export const INVESTMENT_FIELDS = "id quantity value currency instrument { id isin symbol name kind currency exchange lastPrice }";
export const EXPENSE_FIELDS = "id name kind amount currency intervalUnit nextChargeDate outstandingAmount monthlyAmount";

/** Instrument search for ?q=. Provider or rate-limit failures become an inline error, not a crashed page. */
export async function searchInstruments(q: string | undefined): Promise<{ results?: Instrument[]; error?: boolean }> {
  if (!q || q.trim().length < 2) return {};
  try {
    const { searchInstruments } = await gql<{ searchInstruments: Instrument[] }>(
      "query ($q: String!) { searchInstruments(query: $q) { id isin symbol name kind currency exchange lastPrice } }",
      { q: q.trim() },
    );
    return { results: searchInstruments };
  } catch (e) {
    if (e instanceof ApiError) return { error: true };
    throw e;
  }
}

const grid = "grid grid-cols-1 gap-4 sm:grid-cols-2";

async function tools() {
  const [t, format] = await Promise.all([getTranslations("app.finance"), getFormatter()]);
  const money = (value: number, currency: string) => format.number(value, { style: "currency", currency });
  const date = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short", year: "numeric" });
  return { t, money, date };
}

// --- accounts -------------------------------------------------------------------------------

export async function AccountList({ accounts, back, readOnly }: { accounts: Account[]; back: string; readOnly: boolean }) {
  const { t, money } = await tools();
  if (accounts.length === 0) return <Empty>{t("accounts.empty")}</Empty>;
  return (
    <List>
      {accounts.map((a) => (
        <Row key={a.id} title={a.name} meta={[t(`accountKinds.${a.kind}`), a.institution].filter(Boolean).join(" · ")} value={money(a.balance, a.currency)}>
          <form action={updateAccountBalance} className="flex items-center gap-2">
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="id" value={a.id} />
            <label className="sr-only" htmlFor={`balance-${a.id}`}>{t("accounts.balance")}</label>
            <input id={`balance-${a.id}`} name="balance" inputMode="decimal" defaultValue={a.balance} required className={`${inputClass} h-10 w-32 font-mono`} />
            <button disabled={readOnly} className={smallButton}>{t("accounts.update")}</button>
          </form>
          <form action={deleteAccount}>
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="id" value={a.id} />
            <button disabled={readOnly} className={dangerLink}>{t("delete")}</button>
          </form>
        </Row>
      ))}
    </List>
  );
}

export async function AccountForm({ back, currency, readOnly }: { back: string; currency: string; readOnly: boolean }) {
  const { t } = await tools();
  return (
    <form action={createAccount} className="flex flex-col gap-4 border border-ink p-5">
      <input type="hidden" name="back" value={back} />
      <div className={grid}>
        <label className={labelClass}>
          {t("accounts.name")}
          <input name="name" required maxLength={60} placeholder={t("accounts.namePlaceholder")} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("accounts.institution")}
          <input name="institution" maxLength={60} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("accounts.kind")}
          <select name="kind" defaultValue="CHECKING" className={`${inputClass} px-3`}>
            {(["CHECKING", "SAVINGS", "CASH"] as const).map((k) => (
              <option key={k} value={k}>{t(`accountKinds.${k}`)}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <label className={labelClass}>
            {t("accounts.balance")}
            <input name="balance" inputMode="decimal" required placeholder="0,00" className={`${inputClass} font-mono`} />
          </label>
          <label className={labelClass}>
            {t("currency")}
            <input name="currency" defaultValue={currency} pattern="[A-Za-z]{3}" maxLength={3} required className={`${inputClass} font-mono uppercase`} />
          </label>
        </div>
      </div>
      <p className="m-0 text-[13px] text-ink-muted">{t("accounts.bankSoon")}</p>
      <button disabled={readOnly} className={`${smallButton} self-start`}>{t("accounts.add")}</button>
    </form>
  );
}

// --- investments ------------------------------------------------------------------------------

export async function InvestmentList({ investments, back, readOnly }: { investments: Investment[]; back: string; readOnly: boolean }) {
  const { t, money } = await tools();
  if (investments.length === 0) return <Empty>{t("investments.empty")}</Empty>;
  return (
    <List>
      {investments.map((i) => (
        <Row
          key={i.id}
          title={i.instrument.name}
          meta={[t(`instrumentKinds.${i.instrument.kind}` as "instrumentKinds.ETF"), i.instrument.isin ?? i.instrument.symbol].join(" · ")}
          value={i.value == null ? t("investments.noPrice") : money(i.value, i.currency)}
          sub={t("investments.units", { quantity: i.quantity })}
        >
          <form action={deleteInvestment}>
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="id" value={i.id} />
            <button disabled={readOnly} className={dangerLink}>{t("delete")}</button>
          </form>
        </Row>
      ))}
    </List>
  );
}

/** GET form: the page reads ?q= and passes the results back in. */
export async function InvestmentSearch({
  action, query, results, error, back, readOnly, hidden = {},
}: {
  action: string; query?: string; results?: Instrument[]; error?: boolean; back: string; readOnly: boolean; hidden?: Record<string, string>;
}) {
  const { t, money } = await tools();
  return (
    <div className="flex flex-col gap-4 border border-ink p-5">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <label className={`${labelClass} grow`}>
          {t("investments.search")}
          <input name="q" defaultValue={query} required minLength={2} maxLength={60} placeholder={t("investments.searchPlaceholder")} className={inputClass} />
        </label>
        <button className={`${smallButton} h-[52px]`}>{t("investments.find")}</button>
      </form>
      {error && <p className="m-0 text-[15px] text-danger">{t("investments.searchError")}</p>}
      {results && results.length === 0 && <p className="m-0 text-[15px] text-ink-muted">{t("investments.noResults")}</p>}
      {results && results.length > 0 && (
        <List>
          {results.map((r) => (
            <Row
              key={r.id}
              title={r.name}
              meta={[t(`instrumentKinds.${r.kind}` as "instrumentKinds.ETF"), r.isin ?? r.symbol, r.exchange].filter(Boolean).join(" · ")}
              value={r.lastPrice == null ? t("investments.noPrice") : money(r.lastPrice, r.currency)}
            >
              <form action={addInvestment} className="flex items-center gap-2">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="instrumentId" value={r.id} />
                <label className="sr-only" htmlFor={`qty-${r.id}`}>{t("investments.quantity")}</label>
                <input id={`qty-${r.id}`} name="quantity" inputMode="decimal" required placeholder={t("investments.quantity")} className={`${inputClass} h-10 w-32 font-mono`} />
                <button disabled={readOnly} className={smallButton}>{t("investments.add")}</button>
              </form>
            </Row>
          ))}
        </List>
      )}
    </div>
  );
}

// --- recurring expenses -----------------------------------------------------------------------

export async function ExpenseList({ expenses, back, readOnly }: { expenses: Expense[]; back: string; readOnly: boolean }) {
  const { t, money, date } = await tools();
  if (expenses.length === 0) return <Empty>{t("expenses.empty")}</Empty>;
  return (
    <List>
      {expenses.map((e) => (
        <Row
          key={e.id}
          title={e.name}
          meta={`${t(`expenseKinds.${e.kind}`)} · ${t("expenses.next", { date: date(e.nextChargeDate) })}`}
          value={`${money(e.amount, e.currency)} ${t(`per.${e.intervalUnit}`)}`}
          sub={e.outstandingAmount != null ? t("expenses.outstanding", { amount: money(e.outstandingAmount, e.currency) }) : undefined}
        >
          <form action={deleteExpense}>
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="id" value={e.id} />
            <button disabled={readOnly} className={dangerLink}>{t("delete")}</button>
          </form>
        </Row>
      ))}
    </List>
  );
}

export async function ExpenseForm({ back, accounts, readOnly }: { back: string; accounts: Account[]; readOnly: boolean }) {
  const { t } = await tools();
  return (
    <form action={createExpense} className="flex flex-col gap-4 border border-ink p-5">
      <input type="hidden" name="back" value={back} />
      <div className={grid}>
        <label className={labelClass}>
          {t("expenses.name")}
          <input name="name" required maxLength={60} placeholder={t("expenses.namePlaceholder")} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("expenses.kind")}
          <select name="kind" defaultValue="SUBSCRIPTION" className={`${inputClass} px-3`}>
            {(["SUBSCRIPTION", "DEBT", "OTHER"] as const).map((k) => (
              <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t("expenses.amount")}
            <input name="amount" inputMode="decimal" required placeholder="0,00" className={`${inputClass} font-mono`} />
          </label>
          <label className={labelClass}>
            {t("expenses.interval")}
            <select name="intervalUnit" defaultValue="MONTH" className={`${inputClass} px-3`}>
              {(["WEEK", "MONTH", "YEAR"] as const).map((u) => (
                <option key={u} value={u}>{t(`intervals.${u}`)}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          {t("expenses.nextCharge")}
          <input name="nextChargeDate" type="date" required className={`${inputClass} font-mono`} />
        </label>
        <label className={labelClass}>
          {t("expenses.outstandingLabel")}
          <input name="outstandingAmount" inputMode="decimal" placeholder={t("expenses.debtsOnly")} className={`${inputClass} font-mono`} />
        </label>
        <label className={labelClass}>
          {t("expenses.account")}
          <select name="accountId" defaultValue="" className={`${inputClass} px-3`}>
            <option value="">{t("none")}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      </div>
      <button disabled={readOnly} className={`${smallButton} self-start`}>{t("expenses.add")}</button>
    </form>
  );
}
