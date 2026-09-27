// Lists and forms for accounts, investments and recurring items. Shared by the onboarding, Net worth and Transactions.
// In the read-only demo every write control is hidden, not just disabled (PATTERNS §7).
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Banknote, CalendarClock, CreditCard, HandCoins, Landmark, PiggyBank, Plus, Repeat, TrendingUp, Trash2, Wallet, type LucideIcon,
} from "lucide-react";
import { inputClass, labelClass } from "@/components/forms";
import { ApiError, gql } from "@/lib/api";
import { Bar, Empty, List, Row, dangerLink, primaryBtn, smallButton } from "@/components/app/ui";
import {
  addInvestment, createAccount, createExpense, deleteAccount, deleteExpense, deleteInvestment, updateAccountBalance,
} from "@/app/dashboard/actions";

export type Account = { id: string; name: string; institution: string | null; kind: "CHECKING" | "SAVINGS" | "CASH"; currency: string; balance: number };
export type Instrument = { id: string; isin: string | null; symbol: string; name: string; kind: string; currency: string; exchange: string | null; lastPrice: number | null };
export type Investment = { id: string; quantity: number; value: number | null; currency: string; instrument: Instrument };
export type ExpenseKind = "SUBSCRIPTION" | "DEBT" | "OTHER" | "SALARY" | "INVESTMENT" | "OTHER_INCOME";
export type Expense = {
  id: string; name: string; direction: "EXPENSE" | "INCOME"; kind: ExpenseKind; amount: number; currency: string;
  intervalUnit: "WEEK" | "MONTH" | "YEAR"; intervalCount: number; startDate: string; nextChargeDate: string | null;
  initialAmount: number | null; outstandingAmount: number | null; paidAmount: number | null; progress: number | null;
  endsOn: string | null; monthlyAmount: number; categoryId: string | null;
};
export type Category = { id: string; name: string };

export const ACCOUNT_FIELDS = "id name institution kind currency balance";
export const INVESTMENT_FIELDS = "id quantity value currency instrument { id isin symbol name kind currency exchange lastPrice }";
export const EXPENSE_FIELDS =
  "id name direction kind amount currency intervalUnit intervalCount startDate nextChargeDate initialAmount outstandingAmount paidAmount progress endsOn monthlyAmount categoryId";

export const EXPENSE_KINDS = ["SUBSCRIPTION", "OTHER", "DEBT"] as const;
export const INCOME_KINDS = ["SALARY", "INVESTMENT", "OTHER_INCOME"] as const;

const ACCOUNT_ICONS: Record<Account["kind"], LucideIcon> = { CHECKING: CreditCard, SAVINGS: PiggyBank, CASH: Banknote };
const EXPENSE_ICONS: Record<ExpenseKind, LucideIcon> = {
  SUBSCRIPTION: Repeat, OTHER: CalendarClock, DEBT: Landmark, SALARY: Wallet, INVESTMENT: TrendingUp, OTHER_INCOME: HandCoins,
};
const rowIcon = (Icon: LucideIcon) => (
  <span className="flex size-10 shrink-0 items-center justify-center border border-rule text-ink-muted" aria-hidden="true">
    <Icon size={18} strokeWidth={1.9} />
  </span>
);

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
  const monthYear = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { month: "short", year: "numeric" });
  return { t, money, date, monthYear };
}

const Hidden = ({ back, id }: { back: string; id?: string }) => (
  <>
    <input type="hidden" name="back" value={back} />
    {id && <input type="hidden" name="id" value={id} />}
  </>
);

function DeleteButton({ label }: { label: string }) {
  return (
    <button className={`${dangerLink} inline-flex items-center`} aria-label={label} title={label}>
      <Trash2 size={16} aria-hidden />
    </button>
  );
}

// --- accounts -------------------------------------------------------------------------------

export async function AccountList({ accounts, back, readOnly }: { accounts: Account[]; back: string; readOnly: boolean }) {
  const { t, money } = await tools();
  if (accounts.length === 0) return <Empty>{t("accounts.empty")}</Empty>;
  return (
    <List>
      {accounts.map((a) => (
        <Row
          key={a.id}
          title={<span className="flex items-center gap-3">{rowIcon(ACCOUNT_ICONS[a.kind])}{a.name}</span>}
          meta={<span className="pl-[52px]">{[t(`accountKinds.${a.kind}`), a.institution].filter(Boolean).join(" · ")}</span>}
          value={money(a.balance, a.currency)}
        >
          {!readOnly && (
            <>
              <form action={updateAccountBalance} className="flex items-center gap-2">
                <Hidden back={back} id={a.id} />
                <label className="sr-only" htmlFor={`balance-${a.id}`}>{t("accounts.balance")}</label>
                <input id={`balance-${a.id}`} name="balance" inputMode="decimal" defaultValue={a.balance} required className={`${inputClass} h-11 w-32 font-mono`} />
                <button className={smallButton}>{t("accounts.update")}</button>
              </form>
              <form action={deleteAccount}>
                <Hidden back={back} id={a.id} />
                <DeleteButton label={t("delete")} />
              </form>
            </>
          )}
        </Row>
      ))}
    </List>
  );
}

export async function AccountForm({ back, currency, readOnly }: { back: string; currency: string; readOnly: boolean }) {
  if (readOnly) return null;
  const { t } = await tools();
  return (
    <form id="add-account" action={createAccount} className="flex scroll-mt-24 flex-col gap-4 border border-ink p-5">
      <Hidden back={back} />
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
      <button className={`${primaryBtn} self-start`}><Plus size={16} aria-hidden />{t("accounts.add")}</button>
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
          title={<span className="flex items-center gap-3">{rowIcon(TrendingUp)}{i.instrument.name}</span>}
          meta={<span className="pl-[52px] font-mono">{[t(`instrumentKinds.${i.instrument.kind}` as "instrumentKinds.ETF"), i.instrument.isin ?? i.instrument.symbol].join(" · ")}</span>}
          value={i.value == null ? t("investments.noPrice") : money(i.value, i.currency)}
          sub={t("investments.units", { quantity: i.quantity })}
        >
          {!readOnly && (
            <form action={deleteInvestment}>
              <Hidden back={back} id={i.id} />
              <DeleteButton label={t("delete")} />
            </form>
          )}
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
      {error && <p role="alert" className="m-0 border border-danger bg-danger-bg px-4 py-3 text-[15px] text-danger-ink">{t("investments.searchError")}</p>}
      {results && results.length === 0 && (
        <p className="m-0 border border-dashed border-dash px-4 py-3 text-[15px] text-ink-muted">{t("investments.noResults", { query: query ?? "" })}</p>
      )}
      {results && results.length > 0 && (
        <List>
          {results.map((r) => (
            <Row
              key={r.id}
              title={r.name}
              meta={<span className="font-mono">{[t(`instrumentKinds.${r.kind}` as "instrumentKinds.ETF"), r.isin ?? r.symbol, r.exchange].filter(Boolean).join(" · ")}</span>}
              value={r.lastPrice == null ? t("investments.noPrice") : money(r.lastPrice, r.currency)}
            >
              {!readOnly && (
                <form action={addInvestment} className="flex items-center gap-2">
                  <Hidden back={back} />
                  <input type="hidden" name="instrumentId" value={r.id} />
                  <label className="sr-only" htmlFor={`qty-${r.id}`}>{t("investments.quantity")}</label>
                  <input id={`qty-${r.id}`} name="quantity" inputMode="decimal" required placeholder={t("investments.quantity")} className={`${inputClass} h-11 w-32 font-mono`} />
                  <button className={smallButton}>{t("investments.add")}</button>
                </form>
              )}
            </Row>
          ))}
        </List>
      )}
    </div>
  );
}

// --- recurring items (subscriptions, periodic expenses, debts, recurring income) ----------------

export async function ExpenseList({
  expenses, back, readOnly, categories = [],
}: { expenses: Expense[]; back: string; readOnly: boolean; categories?: Category[] }) {
  const { t, money, date, monthYear } = await tools();
  if (expenses.length === 0) return <Empty>{t("expenses.empty")}</Empty>;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  return (
    <List>
      {expenses.map((e) => {
        const income = e.direction === "INCOME";
        const every = e.intervalCount > 1 ? t("everyN", { n: e.intervalCount, unit: t(`units.${e.intervalUnit}`) }) : t(`per.${e.intervalUnit}`);
        const meta = [
          t(`expenseKinds.${e.kind}`),
          e.categoryId && categoryName.get(e.categoryId),
          e.nextChargeDate ? t("expenses.next", { date: date(e.nextChargeDate) }) : t("expenses.finished"),
        ].filter(Boolean).join(" · ");
        return (
          <li key={e.id} className="flex flex-col gap-2.5 border-b border-rule py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {rowIcon(EXPENSE_ICONS[e.kind])}
              <div className="flex min-w-0 grow basis-40 flex-col gap-[3px]">
                <span className="text-base font-semibold">{e.name}</span>
                <span className="text-[13px] text-ink-muted">{meta}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5 font-mono tabular-nums">
                <span className={`text-base ${income ? "text-leaf" : ""}`}>{income ? "+" : ""}{money(e.amount, e.currency)} {every}</span>
                {e.endsOn && e.kind !== "DEBT" && <span className="text-xs text-ink-muted">{t("expenses.until", { date: monthYear(e.endsOn) })}</span>}
              </div>
              {!readOnly && (
                <form action={deleteExpense}>
                  <Hidden back={back} id={e.id} />
                  <DeleteButton label={t("delete")} />
                </form>
              )}
            </div>
            {e.kind === "DEBT" && e.outstandingAmount != null && (
              <div className="flex flex-col gap-1.5 pl-[56px]">
                {e.progress != null && <Bar value={e.progress} max={1} tone="s1" />}
                <div className="flex flex-wrap justify-between gap-x-4 font-mono text-xs text-ink-muted">
                  <span>{t("expenses.outstanding", { amount: money(e.outstandingAmount, e.currency) })}</span>
                  {e.initialAmount != null && e.paidAmount != null && (
                    <span>{t("expenses.paidOf", { paid: money(e.paidAmount, e.currency), total: money(e.initialAmount, e.currency) })}</span>
                  )}
                  {e.endsOn && <span>{t("expenses.endsOn", { date: monthYear(e.endsOn) })}</span>}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </List>
  );
}

/**
 * Schedule fields shared by the recurring form and the "periodic" block of the transaction form:
 * kind (grouped by expense/income), category, frequency, start, duration and, for debts, the initial amount.
 */
export async function RecurringFields({
  categories, startName = "startDate", kinds = "both", withCategory = true,
}: { categories: Category[]; startName?: string; kinds?: "both" | "none"; withCategory?: boolean }) {
  const { t } = await tools();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kinds === "both" && (
        <label className={labelClass}>
          {t("expenses.kind")}
          <select name="kind" defaultValue="" className={`${inputClass} px-3`}>
            <option value="">{t("expenses.kindAuto")}</option>
            <optgroup label={t("expenses.expenseGroup")}>
              {EXPENSE_KINDS.map((k) => <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>)}
            </optgroup>
            <optgroup label={t("expenses.incomeGroup")}>
              {INCOME_KINDS.map((k) => <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>)}
            </optgroup>
          </select>
        </label>
      )}
      <div className="grid grid-cols-[88px_1fr] gap-3">
        <label className={labelClass}>
          {t("expenses.every")}
          <input name="intervalCount" type="number" min={1} max={36} defaultValue={1} className={`${inputClass} font-mono`} />
        </label>
        <label className={labelClass}>
          {t("expenses.interval")}
          <select name="intervalUnit" defaultValue="MONTH" className={`${inputClass} px-3`}>
            {(["WEEK", "MONTH", "YEAR"] as const).map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
          </select>
        </label>
      </div>
      {startName === "startDate" && (
        <label className={labelClass}>
          {t("expenses.start")}
          <input name="startDate" type="date" required className={`${inputClass} font-mono`} />
        </label>
      )}
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0 sm:col-span-2 xl:col-span-3">
        <legend className="mb-2 text-sm font-semibold">{t("expenses.duration")}</legend>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
          <label className="flex items-center gap-2"><input type="radio" name="duration" value="open" defaultChecked className="size-5 accent-leaf" />{t("expenses.durationOpen")}</label>
          <label className="flex items-center gap-2">
            <input type="radio" name="duration" value="until" className="size-5 accent-leaf" />{t("expenses.durationUntil")}
            <input name="endDate" type="date" aria-label={t("expenses.endDate")} className={`${inputClass} h-11 w-44 font-mono`} />
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="duration" value="count" className="size-5 accent-leaf" />
            <input name="paymentsTotal" type="number" min={1} max={1200} aria-label={t("expenses.paymentsTotal")} className={`${inputClass} h-11 w-24 font-mono`} />
            {t("expenses.payments")}
          </label>
        </div>
      </fieldset>
      {withCategory && (
        <label className={labelClass}>
          {t("expenses.category")}
          <select name="categoryId" defaultValue="" className={`${inputClass} px-3`}>
            <option value="">{t("none")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
      <label className={labelClass}>
        <span>{t("expenses.initialAmount")} <span className="font-normal text-ink-muted">({t("expenses.debtsOnly")})</span></span>
        <input name="initialAmount" inputMode="decimal" placeholder="0,00" aria-describedby="initial-hint" className={`${inputClass} font-mono`} />
        <span id="initial-hint" className="text-[13px] font-normal text-ink-muted">{t("expenses.initialHint")}</span>
      </label>
    </div>
  );
}

export async function ExpenseForm({ back, accounts, categories, readOnly }: { back: string; accounts: Account[]; categories: Category[]; readOnly: boolean }) {
  if (readOnly) return null;
  const { t } = await tools();
  return (
    <form id="add-recurring" action={createExpense} className="flex scroll-mt-24 flex-col gap-4 border border-ink p-5">
      <Hidden back={back} />
      <div className={grid}>
        <label className={labelClass}>
          {t("expenses.name")}
          <input name="name" required maxLength={60} placeholder={t("expenses.namePlaceholder")} className={inputClass} />
        </label>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <label className={labelClass}>
            {t("expenses.amount")}
            <input name="amount" inputMode="decimal" required placeholder="0,00" className={`${inputClass} font-mono`} />
          </label>
          <label className={labelClass}>
            {t("currency")}
            <input name="currency" defaultValue="EUR" pattern="[A-Za-z]{3}" maxLength={3} required className={`${inputClass} font-mono uppercase`} />
          </label>
        </div>
        <label className={labelClass}>
          {t("expenses.kind")}
          <select name="kind" defaultValue="SUBSCRIPTION" className={`${inputClass} px-3`}>
            <optgroup label={t("expenses.expenseGroup")}>
              {EXPENSE_KINDS.map((k) => <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>)}
            </optgroup>
            <optgroup label={t("expenses.incomeGroup")}>
              {INCOME_KINDS.map((k) => <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>)}
            </optgroup>
          </select>
        </label>
        <label className={labelClass}>
          {t("expenses.account")}
          <select name="accountId" defaultValue="" className={`${inputClass} px-3`}>
            <option value="">{t("none")}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      </div>
      <RecurringFields categories={categories} kinds="none" />
      <button className={`${primaryBtn} self-start`}><Plus size={16} aria-hidden />{t("expenses.add")}</button>
    </form>
  );
}
