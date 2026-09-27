import { z } from "zod";
import {
  assertOwned, clientError, fail, profileOf, requireAdmin, requireUser, requireWritable, round2, toColumns, toMe,
  type AuthedUser, type Module,
} from "../core.js";
import { parse, primitives as p } from "../validation.js";
import { investmentValues } from "./investments.js";
import { debtStatus, endOfMonth, nextOccurrence, occurrence, occurrencesBetween, type Schedule, type Unit } from "../schedule.js";

const typeDefs = /* GraphQL */ `
  enum AccountKind { CHECKING SAVINGS CASH }
  enum AccountSource { MANUAL BANK }
  enum Direction { EXPENSE INCOME }
  "Expenses: SUBSCRIPTION, DEBT, OTHER (periodic expense). Income: SALARY, INVESTMENT, OTHER_INCOME."
  enum ExpenseKind { SUBSCRIPTION DEBT OTHER SALARY INVESTMENT OTHER_INCOME }
  enum IntervalUnit { WEEK MONTH YEAR }
  enum ExpenseStatus { SUGGESTED ACTIVE PAUSED CANCELLED }

  type Account {
    id: ID!
    name: String!
    institution: String
    kind: AccountKind!
    currency: String!
    balance: Float!
    balanceUpdatedAt: String!
    source: AccountSource!
  }

  "A recurring charge or income: subscription, periodic expense, debt, salary…"
  type RecurringExpense {
    id: ID!
    name: String!
    direction: Direction!
    kind: ExpenseKind!
    amount: Float!
    currency: String!
    intervalUnit: IntervalUnit!
    intervalCount: Int!
    "YYYY-MM-DD, first charge"
    startDate: String!
    "YYYY-MM-DD, last possible charge (inclusive)"
    endDate: String
    "Total number of charges, when limited."
    paymentsTotal: Int
    "YYYY-MM-DD, next charge from today; null once the schedule has ended."
    nextChargeDate: String
    "Debts: amount owed when the debt started."
    initialAmount: Float
    "Debts: amount still owed today (computed from initialAmount and the charges made)."
    outstandingAmount: Float
    "Debts: amount already paid."
    paidAmount: Float
    "Debts: share paid, 0 to 1."
    progress: Float
    "YYYY-MM-DD of the last charge when the schedule is finite (debts: estimated payoff date)."
    endsOn: String
    categoryId: ID
    accountId: ID
    status: ExpenseStatus!
    "Amount normalized to one month (e.g. yearly / 12)."
    monthlyAmount: Float!
  }

  type NetWorthTotals {
    currency: String!
    accounts: Float!
    investments: Float!
    debts: Float!
    "What you have today: accounts + investments."
    current: Float!
    "current + recurring income - recurring expenses still due until the end of this month."
    endOfMonth: Float!
    "current - debts still owed."
    total: Float!
  }

  type NetWorth {
    "One entry per currency (amounts are never converted)."
    totals: [NetWorthTotals!]!
    accounts: [Account!]!
    debts: [RecurringExpense!]!
  }

  input AccountInput {
    name: String!
    institution: String
    kind: AccountKind!
    "ISO 4217, default EUR"
    currency: String
    balance: Float!
  }

  input UpdateAccountInput {
    name: String
    institution: String
    kind: AccountKind
    currency: String
    balance: Float
  }

  input RecurringExpenseInput {
    name: String!
    "Default EXPENSE; must match kind."
    direction: Direction
    kind: ExpenseKind!
    amount: Float!
    currency: String
    intervalUnit: IntervalUnit
    intervalCount: Int
    "YYYY-MM-DD, first charge (may be in the past, e.g. a debt started last year)."
    startDate: String
    "Deprecated alias of startDate."
    nextChargeDate: String
    endDate: String
    paymentsTotal: Int
    "Debts: amount owed at startDate."
    initialAmount: Float
    "Debts without initialAmount: amount owed today."
    outstandingAmount: Float
    categoryId: ID
    accountId: ID
  }

  input UpdateRecurringExpenseInput {
    name: String
    direction: Direction
    kind: ExpenseKind
    amount: Float
    currency: String
    intervalUnit: IntervalUnit
    intervalCount: Int
    startDate: String
    endDate: String
    paymentsTotal: Int
    initialAmount: Float
    outstandingAmount: Float
    categoryId: ID
    accountId: ID
    status: ExpenseStatus
  }

  extend type Query {
    accounts: [Account!]!
    recurringExpenses: [RecurringExpense!]!
    "Active recurring charges due in the next \`days\` days (default 30), soonest first. Expenses unless direction is given."
    upcomingPayments(days: Int = 30, direction: Direction = EXPENSE): [RecurringExpense!]!
    netWorth: NetWorth!
  }

  extend type Mutation {
    createAccount(input: AccountInput!): Account!
    updateAccount(id: ID!, input: UpdateAccountInput!): Account!
    deleteAccount(id: ID!): ID!

    createRecurringExpense(input: RecurringExpenseInput!): RecurringExpense!
    updateRecurringExpense(id: ID!, input: UpdateRecurringExpenseInput!): RecurringExpense!
    deleteRecurringExpense(id: ID!): ID!

    "Free plan: 1 bank account (checking/savings) plus cash. No payments yet: only records the choice."
    setPlan(plan: Plan!): Me!
    "Marks the first-run onboarding as done. Requires the personal details step (full name)."
    completeOnboarding: Me!
  }
`;

// Free plan: one bank account (checking or savings); cash accounts are unlimited.
const FREE_BANK_ACCOUNTS = 1;

type AccountRow = {
  id: number; name: string; institution: string | null; kind: string; currency: string;
  balance: number; balance_updated_at: string; source: string;
};
type ExpenseRow = {
  id: number; name: string; direction: "expense" | "income"; kind: string; amount: number; currency: string;
  interval_unit: Unit; interval_count: number; start_date: string; end_date: string | null; payments_total: number | null;
  initial_amount: number | null; outstanding_amount: number | null; category_id: number | null; account_id: number | null; status: string;
};

const ACCOUNT_COLUMNS = "id, name, institution, kind, currency, balance, balance_updated_at, source";
const EXPENSE_COLUMNS =
  "id, name, direction, kind, amount, currency, interval_unit, interval_count, start_date, end_date, payments_total, initial_amount, outstanding_amount, category_id, account_id, status";

const toAccount = (a: AccountRow) => ({
  id: a.id, name: a.name, institution: a.institution, kind: a.kind, currency: a.currency,
  balance: Number(a.balance), balanceUpdatedAt: a.balance_updated_at, source: a.source,
});

const PER_MONTH: Record<string, number> = { week: 52 / 12, month: 1, year: 1 / 12 };
const today = () => new Date().toISOString().slice(0, 10);
const scheduleOf = (e: ExpenseRow): Schedule => ({
  start: e.start_date, unit: e.interval_unit, count: e.interval_count, endDate: e.end_date, paymentsTotal: e.payments_total,
});

/** Row → API shape. Next charge and debt figures are computed for `on` (today), never stored stale. */
function toExpense(e: ExpenseRow, on = today()) {
  const amount = Number(e.amount);
  const schedule = scheduleOf(e);
  const debt = e.kind === "debt" && e.initial_amount !== null ? debtStatus(Number(e.initial_amount), amount, schedule, on) : null;
  const finite = schedule.paymentsTotal != null ? occurrence(schedule, schedule.paymentsTotal - 1) : e.end_date;
  return {
    id: e.id, name: e.name, direction: e.direction, kind: e.kind, amount, currency: e.currency,
    intervalUnit: e.interval_unit, intervalCount: e.interval_count,
    startDate: e.start_date, endDate: e.end_date, paymentsTotal: e.payments_total,
    nextChargeDate: debt ? debt.next : nextOccurrence(schedule, on),
    initialAmount: e.initial_amount === null ? null : Number(e.initial_amount),
    outstandingAmount: debt ? debt.remaining : e.outstanding_amount === null ? null : Number(e.outstanding_amount),
    paidAmount: debt?.paid ?? null,
    progress: debt?.progress ?? null,
    endsOn: debt?.endsOn ?? finite ?? null,
    categoryId: e.category_id, accountId: e.account_id, status: e.status,
    monthlyAmount: round2((amount * PER_MONTH[e.interval_unit]) / e.interval_count),
    /** Internal (not in the GraphQL type): the effective schedule, debts end once paid off. */
    schedule: debt ? debt.plan : schedule,
  };
}

const ACCOUNT_MAP = { name: "name", institution: "institution", kind: "kind", currency: "currency", balance: "balance" };
const EXPENSE_MAP = {
  name: "name", direction: "direction", kind: "kind", amount: "amount", currency: "currency", intervalUnit: "interval_unit",
  intervalCount: "interval_count", startDate: "start_date", endDate: "end_date", paymentsTotal: "payments_total",
  initialAmount: "initial_amount", outstandingAmount: "outstanding_amount",
  categoryId: "category_id", accountId: "account_id", status: "status",
};

const money = z.number().min(-999_999_999_999.99).max(999_999_999_999.99).multipleOf(0.01);
const accountFields = {
  name: z.string().trim().min(1).max(60),
  institution: p.optText(60),
  kind: z.enum(["checking", "savings", "cash"]),
  currency: p.currency,
  balance: money,
};
const EXPENSE_KINDS = { expense: ["subscription", "debt", "other"], income: ["salary", "investment", "other_income"] } as const;
const expenseFields = {
  name: z.string().trim().min(1).max(60),
  direction: z.enum(["expense", "income"]),
  kind: z.enum(["subscription", "debt", "other", "salary", "investment", "other_income"]),
  amount: p.amount,
  currency: p.currency,
  intervalUnit: z.enum(["week", "month", "year"]),
  intervalCount: z.number().int().min(1).max(36),
  startDate: p.date,
  endDate: p.date.nullable(),
  paymentsTotal: z.number().int().min(1).max(1200).nullable(),
  initialAmount: money.positive().nullable(),
  outstandingAmount: money.min(0).nullable(),
  categoryId: p.id.nullable(),
  accountId: p.id.nullable(),
};
/** kind must belong to the direction; end date can't be before the start. */
const consistent = (e: { direction?: string; kind?: string; startDate?: string; endDate?: string | null }) =>
  (!e.kind || (EXPENSE_KINDS[(e.direction ?? "expense") as "expense" | "income"] as readonly string[]).includes(e.kind)) &&
  (!e.endDate || !e.startDate || e.endDate >= e.startDate);
const schemas = {
  createAccount: z.object({ ...accountFields, institution: accountFields.institution.optional(), currency: p.currency.optional() }),
  updateAccount: z.object(accountFields).partial().refine(p.atLeastOneField, "no hay campos que actualizar"),
  createExpense: z
    .object({
      ...expenseFields,
      direction: expenseFields.direction.default("expense"),
      currency: p.currency.optional(),
      intervalUnit: expenseFields.intervalUnit.optional(),
      intervalCount: expenseFields.intervalCount.optional(),
      startDate: p.date.optional(),
      nextChargeDate: p.date.optional(),
      endDate: expenseFields.endDate.optional(),
      paymentsTotal: expenseFields.paymentsTotal.optional(),
      initialAmount: expenseFields.initialAmount.optional(),
      outstandingAmount: expenseFields.outstandingAmount.optional(),
      categoryId: expenseFields.categoryId.optional(),
      accountId: expenseFields.accountId.optional(),
    })
    // nextChargeDate is the old name of startDate.
    .transform(({ nextChargeDate, ...e }) => ({ ...e, startDate: e.startDate ?? nextChargeDate }))
    .refine((e) => !!e.startDate, { message: "falta la fecha de inicio", path: ["startDate"] })
    .refine(consistent, { message: "el tipo no corresponde a gasto/ingreso o la fecha fin es anterior al inicio", path: ["kind"] }),
  updateExpense: z
    .object({ ...expenseFields, status: z.enum(["suggested", "active", "paused", "cancelled"]) })
    .partial()
    .refine(p.atLeastOneField, "no hay campos que actualizar"),
  days: z.number().int().min(1).max(366),
};

async function bankAccountCount(user: AuthedUser, excludeId?: number) {
  let query = user.db.from("accounts").select("id", { count: "exact", head: true })
    .eq("user_id", user.userId).neq("kind", "cash");
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) fail(error);
  return count ?? 0;
}

async function assertPlanAllowsBankAccount(user: AuthedUser, kind: string | undefined, excludeId?: number) {
  if (!kind || kind === "cash") return;
  const { plan } = await profileOf(user);
  if (plan === "free" && (await bankAccountCount(user, excludeId)) >= FREE_BANK_ACCOUNTS) {
    throw clientError("El plan Gratis incluye 1 banco. Pasa a Pro para añadir más", "PLAN_LIMIT");
  }
}

async function listExpenses(user: AuthedUser) {
  const { data, error } = await user.db
    .from("recurring_expenses")
    .select(EXPENSE_COLUMNS)
    .eq("user_id", user.userId)
    .order("start_date");
  if (error) fail(error);
  const on = today();
  return (data as ExpenseRow[])
    .map((e) => toExpense(e, on))
    // Soonest first; finished schedules last.
    .sort((a, b) => (a.nextChargeDate ?? "9999").localeCompare(b.nextChargeDate ?? "9999"));
}

/** Stored cache of the next charge (kept for SQL-side reads); null schedules keep the start date. */
/**
 * An item that starts today posts today's charge right away; later charges are posted by the daily
 * job (private.post_recurring). Charges before today are never backfilled.
 */
async function postTodayCharge(user: AuthedUser, e: ExpenseRow) {
  const on = today();
  if (e.start_date !== on || e.status !== "active") return;
  const amount = e.kind === "debt" && e.initial_amount !== null ? Math.min(Number(e.amount), Number(e.initial_amount)) : Number(e.amount);
  const { error } = await user.db.from("transactions").upsert(
    {
      user_id: user.userId, type: e.direction, amount, currency: e.currency, category_id: e.category_id, account_id: e.account_id,
      occurred_on: on, note: e.name, source: "recurring", recurring_id: e.id,
    },
    { onConflict: "recurring_id,occurred_on", ignoreDuplicates: true },
  );
  if (error) fail(error);
}

async function refreshNextCache(user: AuthedUser, e: ExpenseRow) {
  const next = toExpense(e).nextChargeDate ?? e.start_date;
  const { error } = await user.db.from("recurring_expenses").update({ next_charge_date: next }).eq("id", e.id).eq("user_id", user.userId);
  if (error) fail(error);
}

async function listAccounts(user: AuthedUser) {
  const { data, error } = await user.db.from("accounts").select(ACCOUNT_COLUMNS).eq("user_id", user.userId).order("id");
  if (error) fail(error);
  return (data as AccountRow[]).map(toAccount);
}

export const finance: Module = {
  typeDefs,
  resolvers: {
    AccountKind: { CHECKING: "checking", SAVINGS: "savings", CASH: "cash" },
    AccountSource: { MANUAL: "manual", BANK: "bank" },
    Direction: { EXPENSE: "expense", INCOME: "income" },
    ExpenseKind: {
      SUBSCRIPTION: "subscription", DEBT: "debt", OTHER: "other",
      SALARY: "salary", INVESTMENT: "investment", OTHER_INCOME: "other_income",
    },
    IntervalUnit: { WEEK: "week", MONTH: "month", YEAR: "year" },
    ExpenseStatus: { SUGGESTED: "suggested", ACTIVE: "active", PAUSED: "paused", CANCELLED: "cancelled" },

    Query: {
      accounts: (_, __, ctx) => listAccounts(requireUser(ctx)),
      recurringExpenses: (_, __, ctx) => listExpenses(requireUser(ctx)),

      upcomingPayments: async (_, args: { days: number; direction: "expense" | "income" }, ctx) => {
        const user = requireUser(ctx);
        const days = parse(schemas.days, args.days);
        const until = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
        return (await listExpenses(user)).filter(
          (e) => e.status === "active" && e.direction === args.direction && e.nextChargeDate !== null && e.nextChargeDate <= until,
        );
      },

      netWorth: async (_, __, ctx) => {
        const user = requireUser(ctx);
        const [accounts, expenses, holdings] = await Promise.all([
          listAccounts(user),
          listExpenses(user),
          investmentValues(ctx, user),
        ]);
        const debts = expenses.filter((e) => e.kind === "debt" && e.status !== "cancelled");

        const totals = new Map<string, { currency: string; accounts: number; investments: number; debts: number; flow: number }>();
        const bucket = (currency: string) => {
          const t = totals.get(currency) ?? { currency, accounts: 0, investments: 0, debts: 0, flow: 0 };
          totals.set(currency, t);
          return t;
        };
        for (const a of accounts) bucket(a.currency).accounts += a.balance;
        for (const h of holdings) if (h.value !== null) bucket(h.currency).investments += h.value;
        for (const d of debts) bucket(d.currency).debts += d.outstandingAmount ?? 0;
        // Money still to come in or go out this month (today's charges count as pending).
        const on = today();
        for (const e of expenses) {
          if (e.status !== "active") continue;
          const charges = occurrencesBetween(e.schedule, on, endOfMonth(on)).length;
          bucket(e.currency).flow += (e.direction === "income" ? 1 : -1) * charges * e.amount;
        }

        return {
          totals: [...totals.values()].map((t) => ({
            currency: t.currency,
            accounts: round2(t.accounts),
            investments: round2(t.investments),
            debts: round2(t.debts),
            current: round2(t.accounts + t.investments),
            endOfMonth: round2(t.accounts + t.investments + t.flow),
            total: round2(t.accounts + t.investments - t.debts),
          })),
          accounts,
          debts,
        };
      },
    },

    Mutation: {
      createAccount: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.createAccount, args.input);
        await assertPlanAllowsBankAccount(user, input.kind);
        const { data, error } = await user.db
          .from("accounts")
          .insert({ ...toColumns(input, ACCOUNT_MAP), user_id: user.userId })
          .select(ACCOUNT_COLUMNS)
          .single<AccountRow>();
        if (error) fail(error);
        return toAccount(data);
      },

      updateAccount: async (_, args: { id: string; input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const input = parse(schemas.updateAccount, args.input);
        await assertPlanAllowsBankAccount(user, input.kind, id);
        const row = toColumns(input, ACCOUNT_MAP);
        if ("balance" in input) row.balance_updated_at = new Date().toISOString();
        const { data, error } = await user.db
          .from("accounts")
          .update(row)
          .eq("id", id)
          .eq("user_id", user.userId)
          .select(ACCOUNT_COLUMNS)
          .single<AccountRow>();
        if (error) fail(error);
        return toAccount(data);
      },

      deleteAccount: async (_, args: { id: string }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const { data, error } = await user.db.from("accounts").delete().eq("id", id).eq("user_id", user.userId).select("id");
        if (error) fail(error);
        if (data.length === 0) throw clientError("No encontrado", "NOT_FOUND");
        return id;
      },

      createRecurringExpense: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.createExpense, args.input);
        await assertOwned(user, "categories", input.categoryId);
        await assertOwned(user, "accounts", input.accountId);
        const row = toColumns(input, EXPENSE_MAP);
        const { data, error } = await user.db
          .from("recurring_expenses")
          .insert({ ...row, next_charge_date: input.startDate, user_id: user.userId })
          .select(EXPENSE_COLUMNS)
          .single<ExpenseRow>();
        if (error) fail(error);
        await refreshNextCache(user, data);
        await postTodayCharge(user, data);
        return toExpense(data);
      },

      updateRecurringExpense: async (_, args: { id: string; input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const input = parse(schemas.updateExpense, args.input);
        await assertOwned(user, "categories", input.categoryId);
        await assertOwned(user, "accounts", input.accountId);
        const { data, error } = await user.db
          .from("recurring_expenses")
          .update(toColumns(input, EXPENSE_MAP))
          .eq("id", id)
          .eq("user_id", user.userId)
          .select(EXPENSE_COLUMNS)
          .single<ExpenseRow>();
        // The database checks kind/direction and dates together (constraint) after a partial update.
        if (error) fail(error);
        await refreshNextCache(user, data);
        return toExpense(data);
      },

      deleteRecurringExpense: async (_, args: { id: string }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const { data, error } = await user.db
          .from("recurring_expenses").delete().eq("id", id).eq("user_id", user.userId).select("id");
        if (error) fail(error);
        if (data.length === 0) throw clientError("No encontrado", "NOT_FOUND");
        return id;
      },

      setPlan: async (_, args: { plan: "free" | "pro" }, ctx) => {
        const user = await requireWritable(ctx);
        if (args.plan === "free" && (await bankAccountCount(user)) > FREE_BANK_ACCOUNTS) {
          throw clientError("Elimina bancos hasta dejar 1 antes de pasar al plan Gratis", "PLAN_LIMIT");
        }
        // plan is not user-writable in the database: only the API (secret key) changes it.
        const { error } = await requireAdmin(ctx).from("profiles").update({ plan: args.plan }).eq("id", user.userId);
        if (error) fail(error);
        user.profile = undefined;
        return toMe(ctx, user);
      },

      completeOnboarding: async (_, __, ctx) => {
        const user = await requireWritable(ctx);
        if (!(await profileOf(user)).full_name) {
          throw clientError("Completa tus datos personales antes de terminar", "BAD_USER_INPUT");
        }
        const { error } = await user.db
          .from("profiles")
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq("id", user.userId);
        if (error) fail(error);
        user.profile = undefined;
        return toMe(ctx, user);
      },
    },
  },
};
