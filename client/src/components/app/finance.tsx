// Lists and forms for accounts, investments and recurring items. Shared by the onboarding, Net worth and Transactions.
// Add and edit forms open in a modal; in the read-only demo every write control is hidden (PATTERNS §7).
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Banknote, CalendarClock, CreditCard, HandCoins, Landmark, Pencil, PiggyBank, Plus, Repeat, TrendingUp, Trash2, Wallet, type LucideIcon,
} from "lucide-react";
import { Input, Label, NativeSelect, NativeSelectOption, inputClass, labelClass, selectClass } from "@/components/forms";
import { Modal } from "@/components/app/modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApiError, gql } from "@/lib/api";
import { Empty, List, Row, dangerLink, primaryBtn, secondaryBtn, smallButton } from "@/components/app/ui";
import {
  addInvestment, createAccount, createExpense, deleteAccount, deleteExpense, deleteInvestment, updateAccount, updateExpense, updateInvestment,
} from "@/app/dashboard/actions";

export type Account = { id: string; name: string; institution: string | null; kind: "CHECKING" | "SAVINGS" | "CASH"; currency: string; balance: number };
export type Instrument = { id: string; isin: string | null; symbol: string; name: string; kind: string; currency: string; exchange: string | null; lastPrice: number | null };
export type Investment = { id: string; quantity: number; costBasis: number | null; value: number | null; currency: string; instrument: Instrument };
export type ExpenseKind = "SUBSCRIPTION" | "DEBT" | "OTHER" | "SALARY" | "INVESTMENT" | "OTHER_INCOME";
export type Expense = {
  id: string; name: string; direction: "EXPENSE" | "INCOME"; kind: ExpenseKind; amount: number; currency: string;
  intervalUnit: "WEEK" | "MONTH" | "YEAR"; intervalCount: number; startDate: string; endDate: string | null; paymentsTotal: number | null;
  nextChargeDate: string | null; initialAmount: number | null; outstandingAmount: number | null; paidAmount: number | null; progress: number | null;
  endsOn: string | null; monthlyAmount: number; categoryId: string | null; accountId: string | null;
};
export type Category = { id: string; name: string };

export const ACCOUNT_FIELDS = "id name institution kind currency balance";
export const INVESTMENT_FIELDS = "id quantity costBasis value currency instrument { id isin symbol name kind currency exchange lastPrice }";
export const EXPENSE_FIELDS =
  "id name direction kind amount currency intervalUnit intervalCount startDate endDate paymentsTotal nextChargeDate initialAmount outstandingAmount paidAmount progress endsOn monthlyAmount categoryId accountId";

export const EXPENSE_KINDS = ["SUBSCRIPTION", "OTHER", "DEBT"] as const;
export const INCOME_KINDS = ["SALARY", "INVESTMENT", "OTHER_INCOME"] as const;

const ACCOUNT_ICONS: Record<Account["kind"], LucideIcon> = { CHECKING: CreditCard, SAVINGS: PiggyBank, CASH: Banknote };
const EXPENSE_ICONS: Record<ExpenseKind, LucideIcon> = {
  SUBSCRIPTION: Repeat, OTHER: CalendarClock, DEBT: Landmark, SALARY: Wallet, INVESTMENT: TrendingUp, OTHER_INCOME: HandCoins,
};
const rowIcon = (Icon: LucideIcon) => (
  <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-band text-ink-muted" aria-hidden="true">
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
const iconAction = `${smallButton} w-11 px-0`;

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

/** Row actions: edit (modal) and delete. */
async function RowActions({ editTitle, edit, deleteAction, back, id }: { editTitle: string; edit: React.ReactNode; deleteAction: (f: FormData) => Promise<void>; back: string; id: string }) {
  const { t } = await tools();
  return (
    <div className="flex items-center gap-1">
      <Modal title={editTitle} trigger={<Pencil size={16} aria-hidden />} triggerLabel={t("edit")} triggerClassName={iconAction} closeLabel={t("close")}>
        {edit}
      </Modal>
      <form action={deleteAction}>
        <Hidden back={back} id={id} />
        <DeleteButton label={t("delete")} />
      </form>
    </div>
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
            <RowActions editTitle={t("accounts.editTitle")} deleteAction={deleteAccount} back={back} id={a.id}
              edit={<AccountForm back={back} currency={a.currency} account={a} />} />
          )}
        </Row>
      ))}
    </List>
  );
}

/** Create (no `account`) or edit an account. */
export async function AccountForm({ back, currency, account }: { back: string; currency: string; account?: Account }) {
  const { t } = await tools();
  return (
    <form action={account ? updateAccount : createAccount} className="flex flex-col gap-4">
      <Hidden back={back} id={account?.id} />
      <div className={grid}>
        <Label className={labelClass}>
          {t("accounts.name")}
          <Input name="name" required maxLength={60} defaultValue={account?.name} placeholder={t("accounts.namePlaceholder")} className={inputClass} />
        </Label>
        <Label className={labelClass}>
          {t("accounts.institution")}
          <Input name="institution" maxLength={60} defaultValue={account?.institution ?? ""} className={inputClass} />
        </Label>
        <Label className={labelClass}>
          {t("accounts.kind")}
          <NativeSelect name="kind" defaultValue={account?.kind ?? "CHECKING"} className={selectClass}>
            {(["CHECKING", "SAVINGS", "CASH"] as const).map((k) => (
              <NativeSelectOption key={k} value={k}>{t(`accountKinds.${k}`)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Label className={labelClass}>
            {t("accounts.balance")}
            <Input name="balance" inputMode="decimal" required defaultValue={account?.balance} placeholder="0,00" className={`${inputClass} font-mono`} />
          </Label>
          <Label className={labelClass}>
            {t("currency")}
            <Input name="currency" defaultValue={account?.currency ?? currency} pattern="[A-Za-z]{3}" maxLength={3} required className={`${inputClass} font-mono uppercase`} />
          </Label>
        </div>
      </div>
      {!account && <p className="m-0 text-[13px] text-ink-muted">{t("accounts.bankSoon")}</p>}
      <button className={`${primaryBtn} self-start`}>{account ? t("save") : <><Plus size={16} aria-hidden />{t("accounts.add")}</>}</button>
    </form>
  );
}

/** "Add account" button + modal. */
export async function AddAccount({ back, currency, readOnly, primary = false }: { back: string; currency: string; readOnly: boolean; primary?: boolean }) {
  if (readOnly) return null;
  const { t } = await tools();
  return (
    <Modal title={t("accounts.add")} trigger={<><Plus size={16} aria-hidden />{t("accounts.add")}</>} triggerClassName={primary ? primaryBtn : secondaryBtn} closeLabel={t("close")}>
      <AccountForm back={back} currency={currency} />
    </Modal>
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
            <RowActions
              editTitle={i.instrument.name}
              deleteAction={deleteInvestment}
              back={back}
              id={i.id}
              edit={
                <form action={updateInvestment} className="flex flex-col gap-4">
                  <Hidden back={back} id={i.id} />
                  <div className={grid}>
                    <Label className={labelClass}>
                      {t("investments.quantity")}
                      <Input name="quantity" inputMode="decimal" required defaultValue={i.quantity} className={`${inputClass} font-mono`} />
                    </Label>
                    <Label className={labelClass}>
                      <span>{t("investments.costBasis")} <span className="font-normal text-ink-muted">({t("optional")})</span></span>
                      <Input name="costBasis" inputMode="decimal" defaultValue={i.costBasis ?? ""} className={`${inputClass} font-mono`} />
                    </Label>
                  </div>
                  <button className={`${primaryBtn} self-start`}>{t("save")}</button>
                </form>
              }
            />
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
    <div className="flex flex-col gap-4 rounded-card border border-rule bg-field p-5">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <Label className={`${labelClass} grow`}>
          {t("investments.search")}
          <Input name="q" defaultValue={query} required minLength={2} maxLength={60} placeholder={t("investments.searchPlaceholder")} className={inputClass} />
        </Label>
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
                  <Input id={`qty-${r.id}`} name="quantity" inputMode="decimal" required placeholder={t("investments.quantity")} className={`${inputClass} h-11 w-32 font-mono`} />
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
  expenses, back, readOnly, categories = [], accounts = [],
}: { expenses: Expense[]; back: string; readOnly: boolean; categories?: Category[]; accounts?: Account[] }) {
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
                <RowActions editTitle={t("expenses.editTitle")} deleteAction={deleteExpense} back={back} id={e.id}
                  edit={<ExpenseForm back={back} accounts={accounts} categories={categories} expense={e} />} />
              )}
            </div>
            {e.kind === "DEBT" && e.outstandingAmount != null && (
              <div className="flex flex-col gap-1.5 pl-[56px]">
                {e.progress != null && (
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-debt" aria-hidden="true">
                    <div className="h-full bg-leaf" style={{ width: `${Math.round(e.progress * 100)}%` }} />
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-x-4 font-mono text-xs text-ink-muted">
                  <span className="text-debt-ink">{t("expenses.outstanding", { amount: money(e.outstandingAmount, e.currency) })}</span>
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
  categories, startName = "startDate", kinds = "both", withCategory = true, expense,
}: { categories: Category[]; startName?: string; kinds?: "both" | "none"; withCategory?: boolean; expense?: Expense }) {
  const { t } = await tools();
  const duration = expense?.endDate ? "until" : expense?.paymentsTotal ? "count" : "open";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {kinds === "both" && (
        <Label className={labelClass}>
          {t("expenses.kind")}
          <NativeSelect name="kind" defaultValue="" className={selectClass}>
            <NativeSelectOption value="">{t("expenses.kindAuto")}</NativeSelectOption>
            <KindOptions t={t} />
          </NativeSelect>
        </Label>
      )}
      <div className="grid grid-cols-[88px_1fr] gap-3">
        <Label className={labelClass}>
          {t("expenses.every")}
          <Input name="intervalCount" type="number" min={1} max={36} defaultValue={expense?.intervalCount ?? 1} className={`${inputClass} font-mono`} />
        </Label>
        <Label className={labelClass}>
          {t("expenses.interval")}
          <NativeSelect name="intervalUnit" defaultValue={expense?.intervalUnit ?? "MONTH"} className={selectClass}>
            {(["WEEK", "MONTH", "YEAR"] as const).map((u) => <NativeSelectOption key={u} value={u}>{t(`units.${u}`)}</NativeSelectOption>)}
          </NativeSelect>
        </Label>
      </div>
      {startName === "startDate" && (
        <Label className={labelClass}>
          {t("expenses.start")}
          <Input name="startDate" type="date" required defaultValue={expense?.startDate} className={`${inputClass} font-mono`} />
        </Label>
      )}
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0 sm:col-span-2">
        <legend className="mb-2 text-sm font-semibold">{t("expenses.duration")}</legend>
        <RadioGroup name="duration" defaultValue={duration} className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
          <label className="flex items-center gap-2"><RadioGroupItem value="open" className="size-5" />{t("expenses.durationOpen")}</label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="until" className="size-5" />{t("expenses.durationUntil")}
            <Input name="endDate" type="date" defaultValue={expense?.endDate ?? ""} aria-label={t("expenses.endDate")} className={`${inputClass} h-11 w-44 font-mono`} />
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="count" className="size-5" />
            <Input name="paymentsTotal" type="number" min={1} max={1200} defaultValue={expense?.paymentsTotal ?? ""} aria-label={t("expenses.paymentsTotal")} className={`${inputClass} h-11 w-24 font-mono`} />
            {t("expenses.payments")}
          </label>
        </RadioGroup>
      </fieldset>
      {withCategory && (
        <Label className={labelClass}>
          {t("expenses.category")}
          <NativeSelect name="categoryId" defaultValue={expense?.categoryId ?? ""} className={selectClass}>
            <NativeSelectOption value="">{t("none")}</NativeSelectOption>
            {categories.map((c) => <NativeSelectOption key={c.id} value={c.id}>{c.name}</NativeSelectOption>)}
          </NativeSelect>
        </Label>
      )}
      <Label className={labelClass}>
        <span>{t("expenses.initialAmount")} <span className="font-normal text-ink-muted">({t("expenses.debtsOnly")})</span></span>
        <Input name="initialAmount" inputMode="decimal" placeholder="0,00" defaultValue={expense?.initialAmount ?? ""} aria-describedby={`initial-hint-${expense?.id ?? startName}`} className={`${inputClass} font-mono`} />
        <span id={`initial-hint-${expense?.id ?? startName}`} className="text-[13px] font-normal text-ink-muted">{t("expenses.initialHint")}</span>
      </Label>
    </div>
  );
}

function KindOptions({ t }: { t: Awaited<ReturnType<typeof tools>>["t"] }) {
  return (
    <>
      <optgroup label={t("expenses.expenseGroup")}>
        {EXPENSE_KINDS.map((k) => <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>)}
      </optgroup>
      <optgroup label={t("expenses.incomeGroup")}>
        {INCOME_KINDS.map((k) => <option key={k} value={k}>{t(`expenseKinds.${k}`)}</option>)}
      </optgroup>
    </>
  );
}

/** Create (no `expense`) or edit a recurring item. */
export async function ExpenseForm({ back, accounts, categories, expense }: { back: string; accounts: Account[]; categories: Category[]; expense?: Expense }) {
  const { t } = await tools();
  return (
    <form action={expense ? updateExpense : createExpense} className="flex flex-col gap-4">
      <Hidden back={back} id={expense?.id} />
      <div className={grid}>
        <Label className={labelClass}>
          {t("expenses.name")}
          <Input name="name" required maxLength={60} defaultValue={expense?.name} placeholder={t("expenses.namePlaceholder")} className={inputClass} />
        </Label>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Label className={labelClass}>
            {t("expenses.amount")}
            <Input name="amount" inputMode="decimal" required defaultValue={expense?.amount} placeholder="0,00" className={`${inputClass} font-mono`} />
          </Label>
          <Label className={labelClass}>
            {t("currency")}
            <Input name="currency" defaultValue={expense?.currency ?? "EUR"} pattern="[A-Za-z]{3}" maxLength={3} required className={`${inputClass} font-mono uppercase`} />
          </Label>
        </div>
        <Label className={labelClass}>
          {t("expenses.kind")}
          <NativeSelect name="kind" defaultValue={expense?.kind ?? "SUBSCRIPTION"} className={selectClass}>
            <KindOptions t={t} />
          </NativeSelect>
        </Label>
        <Label className={labelClass}>
          {t("expenses.account")}
          <NativeSelect name="accountId" defaultValue={expense?.accountId ?? ""} className={selectClass}>
            <NativeSelectOption value="">{t("none")}</NativeSelectOption>
            {accounts.map((a) => <NativeSelectOption key={a.id} value={a.id}>{a.name}</NativeSelectOption>)}
          </NativeSelect>
        </Label>
      </div>
      <RecurringFields categories={categories} kinds="none" expense={expense} />
      <button className={`${primaryBtn} self-start`}>{expense ? t("save") : <><Plus size={16} aria-hidden />{t("expenses.add")}</>}</button>
    </form>
  );
}

/** "Add recurring" button + modal. */
export async function AddExpense({ back, accounts, categories, readOnly, primary = false }: { back: string; accounts: Account[]; categories: Category[]; readOnly: boolean; primary?: boolean }) {
  if (readOnly) return null;
  const { t } = await tools();
  return (
    <Modal title={t("expenses.add")} trigger={<><Plus size={16} aria-hidden />{t("expenses.add")}</>} triggerClassName={primary ? primaryBtn : secondaryBtn} closeLabel={t("close")}>
      <ExpenseForm back={back} accounts={accounts} categories={categories} />
    </Modal>
  );
}
