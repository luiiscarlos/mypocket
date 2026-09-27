import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { parse, schemas } from "./validation.js";
import { rateLimit } from "./rate-limit.js";
import {
  JSONScalar, assertOwned, toMe, clientError, fail, profileOf, requireAdmin, requirePro, requireUser, requireWritable, round2, toColumns,
  type AuthedUser, type Context, type ResolverMap,
} from "./core.js";
import { finance } from "./modules/finance.js";
import { investments } from "./modules/investments.js";
import { simulations } from "./modules/simulations.js";
import { support } from "./modules/support.js";
import { updates } from "./modules/updates.js";

export type { Context } from "./core.js";

const typeDefs = /* GraphQL */ `
  enum TransactionType {
    INCOME
    EXPENSE
  }

  enum TransactionSource {
    MANUAL
    OCR
    BANK
    "Posted automatically from a recurring item."
    RECURRING
  }

  enum ContactTopic {
    SUPPORT
    BANK
    BILLING
    OTHER
  }

  input ContactMessageInput {
    name: String!
    email: String!
    topic: ContactTopic!
    message: String!
    "Must be true: the sender accepted the privacy policy."
    acceptPrivacy: Boolean!
  }

  scalar JSON

  enum AccountType {
    REAL
    DEMO
  }

  enum Plan {
    FREE
    PRO
  }

  enum Theme {
    LIGHT
    DARK
    SYSTEM
  }

  enum Locale {
    ES
    EN
  }

  type Me {
    id: ID!
    email: String
    displayName: String
    currency: String!
    accountType: AccountType!
    "Only the owner can connect real bank accounts."
    isOwner: Boolean!
    "Public demo account: can read, cannot change anything."
    readOnly: Boolean!
    fullName: String
    phone: String
    addressLine: String
    postalCode: String
    city: String
    "ISO 3166-1 alpha-2"
    country: String
    "YYYY-MM-DD"
    birthDate: String
    plan: Plan!
    theme: Theme!
    locale: Locale!
    notificationsEnabled: Boolean!
    "Can read and answer every support ticket."
    isAdmin: Boolean!
    "False until the first-run onboarding is finished; the app must send the user there."
    onboardingCompleted: Boolean!
  }

  type Category {
    id: ID!
    name: String!
    icon: String
    color: String
  }

  type Transaction {
    id: ID!
    type: TransactionType!
    amount: Float!
    currency: String!
    category: Category
    accountId: ID
    "Recurring item that posted it (source RECURRING)."
    recurringId: ID
    "YYYY-MM-DD"
    occurredOn: String!
    note: String
    source: TransactionSource!
    createdAt: String!
  }

  type CurrencyTotals {
    currency: String!
    income: Float!
    expense: Float!
    balance: Float!
  }

  type CategoryTotal {
    "Null for transactions without category."
    category: Category
    type: TransactionType!
    currency: String!
    total: Float!
    count: Int!
  }

  type MonthlySummary {
    "YYYY-MM"
    month: String!
    "True when the month has no transactions: show an empty state."
    isEmpty: Boolean!
    "One entry per currency used that month (amounts are never converted)."
    totals: [CurrencyTotals!]!
    byCategory: [CategoryTotal!]!
  }

  input TransactionFilter {
    "YYYY-MM-DD, inclusive"
    from: String
    "YYYY-MM-DD, inclusive"
    to: String
    type: TransactionType
    categoryId: ID
    accountId: ID
  }

  enum TransactionOrder {
    DATE_DESC
    DATE_ASC
    AMOUNT_DESC
    AMOUNT_ASC
  }

  input CreateTransactionInput {
    type: TransactionType!
    amount: Float!
    "ISO 4217, default EUR"
    currency: String
    categoryId: ID
    accountId: ID
    "YYYY-MM-DD, default today"
    occurredOn: String
    note: String
  }

  "Only the fields sent are changed; send null to clear categoryId or note."
  input UpdateTransactionInput {
    type: TransactionType
    amount: Float
    currency: String
    categoryId: ID
    accountId: ID
    occurredOn: String
    note: String
  }

  input CreateCategoryInput {
    name: String!
    icon: String
    "#rrggbb"
    color: String
  }

  input UpdateCategoryInput {
    name: String
    icon: String
    color: String
  }

  "Only the fields sent are changed; send null to clear an optional one."
  input UpdateProfileInput {
    displayName: String
    currency: String
    fullName: String
    phone: String
    addressLine: String
    postalCode: String
    city: String
    country: String
    birthDate: String
    theme: Theme
    locale: Locale
    notificationsEnabled: Boolean
  }

  type Query {
    health: String!
    me: Me!
    categories: [Category!]!
    "Newest first. limit max 100."
    transactions(filter: TransactionFilter, orderBy: TransactionOrder = DATE_DESC, limit: Int = 50, offset: Int = 0): [Transaction!]!
    transaction(id: ID!): Transaction
    "month: any YYYY-MM-DD inside the month."
    monthlySummary(month: String!): MonthlySummary!
    "All your data as JSON (GDPR data portability)."
    exportMyData: String!
  }

  type Mutation {
    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!
    "Returns the deleted id."
    deleteTransaction(id: ID!): ID!

    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    "Transactions of the deleted category keep existing without category. Returns the deleted id."
    deleteCategory(id: ID!): ID!

    updateProfile(input: UpdateProfileInput!): Me!
    "Public contact form. Rate limited per IP."
    sendContactMessage(input: ContactMessageInput!): Boolean!

    "Deletes the account and all its data permanently (GDPR). Signs out every session."
    deleteMyAccount: Boolean!
  }
`;

type CategoryRow = { id: number; name: string; icon: string | null; color: string | null };

type TransactionRow = {
  id: number;
  type: string;
  amount: number;
  currency: string;
  occurred_on: string;
  note: string | null;
  source: string;
  created_at: string;
  account_id: number | null;
  recurring_id: number | null;
  category: CategoryRow | null;
};

type SummaryRow = {
  category_id: number | null;
  category_name: string | null;
  type: string;
  currency: string;
  total: number;
  tx_count: number;
};

const CATEGORY_COLUMNS = "id, name, icon, color";
const TRANSACTION_COLUMNS = `id, type, amount, currency, occurred_on, note, source, created_at, account_id, recurring_id, category:categories(${CATEGORY_COLUMNS})`;

const toTransaction = (t: TransactionRow) => ({
  id: t.id,
  type: t.type,
  amount: t.amount,
  currency: t.currency,
  occurredOn: t.occurred_on,
  note: t.note,
  source: t.source,
  createdAt: t.created_at,
  accountId: t.account_id,
  recurringId: t.recurring_id,
  category: t.category,
});

// camelCase input keys → snake_case columns. GraphQL only includes keys the client sent,
// so explicit nulls survive and absent keys are skipped.
// camelCase input keys → snake_case columns. GraphQL only includes keys the client sent,
// so explicit nulls survive and absent keys are skipped.
const COLUMNS: Record<string, string> = {
  type: "type",
  amount: "amount",
  currency: "currency",
  categoryId: "category_id",
  accountId: "account_id",
  occurredOn: "occurred_on",
  note: "note",
  name: "name",
  icon: "icon",
  color: "color",
  displayName: "display_name",
  fullName: "full_name",
  phone: "phone",
  addressLine: "address_line",
  postalCode: "postal_code",
  city: "city",
  country: "country",
  birthDate: "birth_date",
  theme: "theme",
  locale: "locale",
  notificationsEnabled: "notifications_enabled",
};
const toRow = (input: Record<string, unknown>) => toColumns(input, COLUMNS);



const base: ResolverMap = {
    JSON: JSONScalar,
    TransactionType: { INCOME: "income", EXPENSE: "expense" },
    TransactionSource: { MANUAL: "manual", OCR: "ocr", BANK: "bank", RECURRING: "recurring" },
    AccountType: { REAL: "real", DEMO: "demo" },
    Plan: { FREE: "free", PRO: "pro" },
    Theme: { LIGHT: "light", DARK: "dark", SYSTEM: "system" },
    ContactTopic: { SUPPORT: "support", BANK: "bank", BILLING: "billing", OTHER: "other" },

    Query: {
      health: () => "ok",

      me: (_, __, ctx) => toMe(ctx, requireUser(ctx)),

      categories: async (_, __, ctx) => {
        const user = requireUser(ctx);
        const { data, error } = await user.db
          .from("categories")
          .select(CATEGORY_COLUMNS)
          .eq("user_id", user.userId)
          .order("name");
        if (error) fail(error);
        return data;
      },

      transactions: async (_, args: { filter?: unknown; orderBy?: string; limit: number; offset: number }, ctx) => {
        const user = requireUser(ctx);
        const filter = parse(schemas.transactionFilter, args.filter) ?? {};
        const { limit, offset } = parse(schemas.page, { limit: args.limit, offset: args.offset });

        let query = user.db
          .from("transactions")
          .select(TRANSACTION_COLUMNS)
          .eq("user_id", user.userId)
          .order(args.orderBy?.startsWith("AMOUNT") ? "amount" : "occurred_on", { ascending: args.orderBy?.endsWith("ASC") ?? false })
          .order("id", { ascending: false })
          .range(offset, offset + limit - 1);
        if (filter.from) query = query.gte("occurred_on", filter.from);
        if (filter.to) query = query.lte("occurred_on", filter.to);
        if (filter.type) query = query.eq("type", filter.type);
        if (filter.categoryId) query = query.eq("category_id", filter.categoryId);
        if (filter.accountId) query = query.eq("account_id", filter.accountId);

        const { data, error } = await query.overrideTypes<TransactionRow[], { merge: false }>();
        if (error) fail(error);
        return data.map(toTransaction);
      },

      transaction: async (_, args: { id: string }, ctx) => {
        const user = requireUser(ctx);
        const { data, error } = await user.db
          .from("transactions")
          .select(TRANSACTION_COLUMNS)
          .eq("id", parse(schemas.id, args.id))
          .eq("user_id", user.userId)
          .maybeSingle<TransactionRow>();
        if (error) fail(error);
        return data && toTransaction(data);
      },

      monthlySummary: async (_, args: { month: string }, ctx) => {
        const user = requireUser(ctx);
        await requirePro(user);
        const month = parse(schemas.month, args.month);
        const { data: rows, error } = await user.db.rpc("monthly_summary", { p_month: month });
        if (error) fail(error);
        const data = rows as SummaryRow[];

        const totals = new Map<string, { currency: string; income: number; expense: number }>();
        for (const row of data) {
          const t = totals.get(row.currency) ?? { currency: row.currency, income: 0, expense: 0 };
          t[row.type as "income" | "expense"] += Number(row.total);
          totals.set(row.currency, t);
        }

        return {
          month: month.slice(0, 7),
          isEmpty: data.length === 0,
          totals: [...totals.values()].map((t) => ({
            currency: t.currency,
            income: round2(t.income),
            expense: round2(t.expense),
            balance: round2(t.income - t.expense),
          })),
          byCategory: data
            .map((row) => ({
              category: row.category_id === null ? null : { id: row.category_id, name: row.category_name },
              type: row.type,
              currency: row.currency,
              total: Number(row.total),
              count: Number(row.tx_count),
            }))
            .sort((a, b) => b.total - a.total),
        };
      },

      exportMyData: async (_, __, ctx) => {
        const user = requireUser(ctx);
        // ponytail: loads everything in memory; fine for one person's finances, stream it if exports get huge.
        const [profile, categories, transactions] = await Promise.all([
          user.db.from("profiles").select("*").eq("id", user.userId).single(),
          user.db.from("categories").select("*").eq("user_id", user.userId).order("id"),
          user.db.from("transactions").select("*").eq("user_id", user.userId).order("id"),
        ]);
        for (const r of [profile, categories, transactions]) if (r.error) fail(r.error);
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          email: user.email,
          profile: profile.data,
          categories: categories.data,
          transactions: transactions.data,
        });
      },
    },

    Mutation: {
      createTransaction: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.createTransaction, args.input);
        await assertOwned(user, "categories", input.categoryId);
        await assertOwned(user, "accounts", input.accountId);
        const { data, error } = await user.db
          .from("transactions")
          .insert({ ...toRow(input), user_id: user.userId })
          .select(TRANSACTION_COLUMNS)
          .single<TransactionRow>();
        if (error) fail(error);
        return toTransaction(data);
      },

      updateTransaction: async (_, args: { id: string; input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(schemas.id, args.id);
        const input = parse(schemas.updateTransaction, args.input);
        await assertOwned(user, "categories", input.categoryId);
        await assertOwned(user, "accounts", input.accountId);
        const { data, error } = await user.db
          .from("transactions")
          .update(toRow(input))
          .eq("id", id)
          .eq("user_id", user.userId)
          .select(TRANSACTION_COLUMNS)
          .single<TransactionRow>();
        if (error) fail(error);
        return toTransaction(data);
      },

      deleteTransaction: async (_, args: { id: string }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(schemas.id, args.id);
        const { data, error } = await user.db
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", user.userId)
          .select("id");
        if (error) fail(error);
        if (data.length === 0) throw clientError("No encontrado", "NOT_FOUND");
        return id;
      },

      createCategory: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.createCategory, args.input);
        const { data, error } = await user.db
          .from("categories")
          .insert({ ...toRow(input), user_id: user.userId })
          .select(CATEGORY_COLUMNS)
          .single<CategoryRow>();
        if (error) fail(error);
        return data;
      },

      updateCategory: async (_, args: { id: string; input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(schemas.id, args.id);
        const input = parse(schemas.updateCategory, args.input);
        const { data, error } = await user.db
          .from("categories")
          .update(toRow(input))
          .eq("id", id)
          .eq("user_id", user.userId)
          .select(CATEGORY_COLUMNS)
          .single<CategoryRow>();
        if (error) fail(error);
        return data;
      },

      deleteCategory: async (_, args: { id: string }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(schemas.id, args.id);
        const { data, error } = await user.db
          .from("categories")
          .delete()
          .eq("id", id)
          .eq("user_id", user.userId)
          .select("id");
        if (error) fail(error);
        if (data.length === 0) throw clientError("No encontrado", "NOT_FOUND");
        return id;
      },

      updateProfile: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.updateProfile, args.input);
        const { error } = await user.db.from("profiles").update(toRow(input)).eq("id", user.userId);
        if (error) fail(error);
        user.profile = undefined;
        return toMe(ctx, user);
      },

      sendContactMessage: async (_, args: { input: unknown }, ctx) => {
        const input = parse(schemas.contactMessage, args.input);
        const retryAfter = rateLimit(`contact:${ctx.clientIp}`, 5, 60 * 60_000);
        if (retryAfter !== null) {
          throw new GraphQLError("Has enviado demasiados mensajes, prueba más tarde", {
            extensions: { code: "RATE_LIMITED", http: { status: 429, headers: { "Retry-After": String(retryAfter) } } },
          });
        }
        if (!ctx.admin) throw new Error("SUPABASE_SECRET_KEY is not configured");
        const { acceptPrivacy: _consent, ...row } = input;
        const { error } = await ctx.admin.from("contact_messages").insert(row);
        if (error) fail(error);
        return true;
      },

      deleteMyAccount: async (_, __, ctx) => {
        const user = await requireWritable(ctx);
        if (!ctx.admin) throw new Error("SUPABASE_SECRET_KEY is not configured");
        // Revoke refresh tokens first: deleting a user does not invalidate sessions by itself.
        const signOut = await ctx.admin.auth.admin.signOut(user.token, "global");
        if (signOut.error) throw new Error(`signOut failed: ${signOut.error.message}`);
        const { error } = await ctx.admin.auth.admin.deleteUser(user.userId);
        if (error) throw new Error(`deleteUser failed: ${error.message}`);
        return true; // profile, categories and transactions go with it (on delete cascade)
      },
    },
};

export const schema = createSchema<Context>({
  typeDefs: [typeDefs, finance.typeDefs, investments.typeDefs, simulations.typeDefs, updates.typeDefs, support.typeDefs],
  resolvers: [base, finance.resolvers, investments.resolvers, simulations.resolvers, updates.resolvers, support.resolvers] as never,
});
