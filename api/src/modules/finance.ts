import { z } from "zod";
import {
  assertOwned, clientError, fail, profileOf, requireAdmin, requireUser, requireWritable, round2, toColumns, toMe,
  type AuthedUser, type Module,
} from "../core.js";
import { parse, primitives as p } from "../validation.js";
import { investmentValues } from "./investments.js";

const typeDefs = /* GraphQL */ `
  enum AccountKind { CHECKING SAVINGS CASH }
  enum AccountSource { MANUAL BANK }
  enum ExpenseKind { SUBSCRIPTION DEBT OTHER }
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

  type RecurringExpense {
    id: ID!
    name: String!
    kind: ExpenseKind!
    amount: Float!
    currency: String!
    intervalUnit: IntervalUnit!
    intervalCount: Int!
    "YYYY-MM-DD"
    nextChargeDate: String!
    "Debts only: amount still owed."
    outstandingAmount: Float
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
    "accounts + investments - debts"
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
    kind: ExpenseKind!
    amount: Float!
    currency: String
    intervalUnit: IntervalUnit
    intervalCount: Int
    nextChargeDate: String!
    outstandingAmount: Float
    categoryId: ID
    accountId: ID
  }

  input UpdateRecurringExpenseInput {
    name: String
    kind: ExpenseKind
    amount: Float
    currency: String
    intervalUnit: IntervalUnit
    intervalCount: Int
    nextChargeDate: String
    outstandingAmount: Float
    categoryId: ID
    accountId: ID
    status: ExpenseStatus
  }

  extend type Query {
    accounts: [Account!]!
    recurringExpenses: [RecurringExpense!]!
    "Active recurring charges due in the next \`days\` days (default 30), soonest first."
    upcomingPayments(days: Int = 30): [RecurringExpense!]!
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
  id: number; name: string; kind: string; amount: number; currency: string; interval_unit: string;
  interval_count: number; next_charge_date: string; outstanding_amount: number | null;
  category_id: number | null; account_id: number | null; status: string;
};

const ACCOUNT_COLUMNS = "id, name, institution, kind, currency, balance, balance_updated_at, source";
const EXPENSE_COLUMNS =
  "id, name, kind, amount, currency, interval_unit, interval_count, next_charge_date, outstanding_amount, category_id, account_id, status";

const toAccount = (a: AccountRow) => ({
  id: a.id, name: a.name, institution: a.institution, kind: a.kind, currency: a.currency,
  balance: Number(a.balance), balanceUpdatedAt: a.balance_updated_at, source: a.source,
});

const PER_MONTH: Record<string, number> = { week: 52 / 12, month: 1, year: 1 / 12 };
const toExpense = (e: ExpenseRow) => ({
  id: e.id, name: e.name, kind: e.kind, amount: Number(e.amount), currency: e.currency,
  intervalUnit: e.interval_unit, intervalCount: e.interval_count, nextChargeDate: e.next_charge_date,
  outstandingAmount: e.outstanding_amount === null ? null : Number(e.outstanding_amount),
  categoryId: e.category_id, accountId: e.account_id, status: e.status,
  monthlyAmount: round2((Number(e.amount) * PER_MONTH[e.interval_unit]) / e.interval_count),
});

const ACCOUNT_MAP = { name: "name", institution: "institution", kind: "kind", currency: "currency", balance: "balance" };
const EXPENSE_MAP = {
  name: "name", kind: "kind", amount: "amount", currency: "currency", intervalUnit: "interval_unit",
  intervalCount: "interval_count", nextChargeDate: "next_charge_date", outstandingAmount: "outstanding_amount",
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
const expenseFields = {
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["subscription", "debt", "other"]),
  amount: p.amount,
  currency: p.currency,
  intervalUnit: z.enum(["week", "month", "year"]),
  intervalCount: z.number().int().min(1).max(36),
  nextChargeDate: p.date,
  outstandingAmount: money.min(0).nullable(),
  categoryId: p.id.nullable(),
  accountId: p.id.nullable(),
};
const schemas = {
  createAccount: z.object({ ...accountFields, institution: accountFields.institution.optional(), currency: p.currency.optional() }),
  updateAccount: z.object(accountFields).partial().refine(p.atLeastOneField, "no hay campos que actualizar"),
  createExpense: z.object({
    ...expenseFields,
    currency: p.currency.optional(),
    intervalUnit: expenseFields.intervalUnit.optional(),
    intervalCount: expenseFields.intervalCount.optional(),
    outstandingAmount: expenseFields.outstandingAmount.optional(),
    categoryId: expenseFields.categoryId.optional(),
    accountId: expenseFields.accountId.optional(),
  }),
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
    .order("next_charge_date");
  if (error) fail(error);
  return (data as ExpenseRow[]).map(toExpense);
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
    ExpenseKind: { SUBSCRIPTION: "subscription", DEBT: "debt", OTHER: "other" },
    IntervalUnit: { WEEK: "week", MONTH: "month", YEAR: "year" },
    ExpenseStatus: { SUGGESTED: "suggested", ACTIVE: "active", PAUSED: "paused", CANCELLED: "cancelled" },

    Query: {
      accounts: (_, __, ctx) => listAccounts(requireUser(ctx)),
      recurringExpenses: (_, __, ctx) => listExpenses(requireUser(ctx)),

      upcomingPayments: async (_, args: { days: number }, ctx) => {
        const user = requireUser(ctx);
        const days = parse(schemas.days, args.days);
        const today = new Date();
        const until = new Date(today.getTime() + days * 86_400_000);
        const { data, error } = await user.db
          .from("recurring_expenses")
          .select(EXPENSE_COLUMNS)
          .eq("user_id", user.userId)
          .eq("status", "active")
          .gte("next_charge_date", today.toISOString().slice(0, 10))
          .lte("next_charge_date", until.toISOString().slice(0, 10))
          .order("next_charge_date");
        if (error) fail(error);
        return (data as ExpenseRow[]).map(toExpense);
      },

      netWorth: async (_, __, ctx) => {
        const user = requireUser(ctx);
        const [accounts, expenses, holdings] = await Promise.all([
          listAccounts(user),
          listExpenses(user),
          investmentValues(ctx, user),
        ]);
        const debts = expenses.filter((e) => e.kind === "debt" && e.status !== "cancelled");

        const totals = new Map<string, { currency: string; accounts: number; investments: number; debts: number }>();
        const bucket = (currency: string) => {
          const t = totals.get(currency) ?? { currency, accounts: 0, investments: 0, debts: 0 };
          totals.set(currency, t);
          return t;
        };
        for (const a of accounts) bucket(a.currency).accounts += a.balance;
        for (const h of holdings) if (h.value !== null) bucket(h.currency).investments += h.value;
        for (const d of debts) bucket(d.currency).debts += d.outstandingAmount ?? 0;

        return {
          totals: [...totals.values()].map((t) => ({
            currency: t.currency,
            accounts: round2(t.accounts),
            investments: round2(t.investments),
            debts: round2(t.debts),
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
        const { data, error } = await user.db
          .from("recurring_expenses")
          .insert({ ...toColumns(input, EXPENSE_MAP), user_id: user.userId })
          .select(EXPENSE_COLUMNS)
          .single<ExpenseRow>();
        if (error) fail(error);
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
        if (error) fail(error);
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
