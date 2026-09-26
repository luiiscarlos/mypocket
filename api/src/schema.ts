import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { parse, schemas } from "./validation.js";
import { rateLimit } from "./rate-limit.js";

type Profile = {
  id: string;
  display_name: string | null;
  currency: string;
  account_type: "real" | "demo";
  read_only: boolean;
};

export type AuthedUser = {
  userId: string;
  email: string | null;
  token: string;
  /** Supabase client that runs as the user, so Postgres RLS applies to every query. */
  db: SupabaseClient;
  profile?: Promise<Profile>;
};

export type Context = {
  user: AuthedUser | null;
  /** Secret-key client, only for account deletion. Null when SUPABASE_SECRET_KEY is not set. */
  admin: SupabaseClient | null;
  ownerUserId: string | null;
  /** Client IP forwarded by the BFF (trusted only after the internal-secret check). */
  clientIp: string;
};

const typeDefs = /* GraphQL */ `
  enum TransactionType {
    INCOME
    EXPENSE
  }

  enum TransactionSource {
    MANUAL
    OCR
    BANK
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

  enum AccountType {
    REAL
    DEMO
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
  }

  input CreateTransactionInput {
    type: TransactionType!
    amount: Float!
    "ISO 4217, default EUR"
    currency: String
    categoryId: ID
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

  input UpdateProfileInput {
    displayName: String
    currency: String
  }

  type Query {
    health: String!
    me: Me!
    categories: [Category!]!
    "Newest first. limit max 100."
    transactions(filter: TransactionFilter, limit: Int = 50, offset: Int = 0): [Transaction!]!
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

const PROFILE_COLUMNS = "id, display_name, currency, account_type, read_only";
const CATEGORY_COLUMNS = "id, name, icon, color";
const TRANSACTION_COLUMNS = `id, type, amount, currency, occurred_on, note, source, created_at, category:categories(${CATEGORY_COLUMNS})`;

const toTransaction = (t: TransactionRow) => ({
  id: t.id,
  type: t.type,
  amount: t.amount,
  currency: t.currency,
  occurredOn: t.occurred_on,
  note: t.note,
  source: t.source,
  createdAt: t.created_at,
  category: t.category,
});

// camelCase input keys → snake_case columns. GraphQL only includes keys the client sent,
// so explicit nulls survive and absent keys are skipped.
const COLUMNS: Record<string, string> = {
  type: "type",
  amount: "amount",
  currency: "currency",
  categoryId: "category_id",
  occurredOn: "occurred_on",
  note: "note",
  name: "name",
  icon: "icon",
  color: "color",
  displayName: "display_name",
};
const toRow = (input: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(input).map(([key, value]) => [COLUMNS[key], value]));

const round2 = (n: number) => Math.round(n * 100) / 100;

const clientError = (message: string, code: string) => new GraphQLError(message, { extensions: { code } });

// Never return Postgres messages to the client: they leak table and constraint names.
function fail(error: PostgrestError): never {
  switch (error.code) {
    case "PGRST116":
      throw clientError("No encontrado", "NOT_FOUND");
    case "42501":
      throw clientError("No tienes permiso para esta operación", "FORBIDDEN");
    case "23505":
      throw clientError("Ya existe un elemento con esos datos", "CONFLICT");
    case "23502":
    case "23503":
    case "23514":
    case "22P02":
    case "22007":
    case "22008":
      console.warn("rejected by database constraint:", error.code, error.message);
      throw clientError("Datos no válidos", "BAD_USER_INPUT");
    default:
      throw new Error(`${error.code}: ${error.message}`); // masked by Yoga, logged server-side
  }
}

function requireUser(ctx: Context): AuthedUser {
  if (!ctx.user) throw clientError("Inicia sesión para continuar", "UNAUTHENTICATED");
  return ctx.user;
}

function profileOf(user: AuthedUser): Promise<Profile> {
  user.profile ??= (async () => {
    const { data, error } = await user.db
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.userId)
      .single<Profile>();
    if (error) fail(error);
    return data;
  })();
  return user.profile;
}

async function requireWritable(ctx: Context): Promise<AuthedUser> {
  const user = requireUser(ctx);
  if ((await profileOf(user)).read_only) {
    throw clientError("La cuenta demo es de solo lectura", "FORBIDDEN");
  }
  return user;
}

async function assertOwnCategory(user: AuthedUser, categoryId: number | null | undefined) {
  if (categoryId == null) return;
  const { data, error } = await user.db
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", user.userId)
    .maybeSingle();
  if (error) fail(error);
  if (!data) throw clientError("Categoría no encontrada", "BAD_USER_INPUT");
}

async function toMe(ctx: Context, user: AuthedUser) {
  const p = await profileOf(user);
  return {
    id: p.id,
    email: user.email,
    displayName: p.display_name,
    currency: p.currency,
    accountType: p.account_type,
    isOwner: p.account_type === "real" && ctx.ownerUserId === p.id,
    readOnly: p.read_only,
  };
}

export const schema = createSchema<Context>({
  typeDefs,
  resolvers: {
    TransactionType: { INCOME: "income", EXPENSE: "expense" },
    TransactionSource: { MANUAL: "manual", OCR: "ocr", BANK: "bank" },
    AccountType: { REAL: "real", DEMO: "demo" },
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

      transactions: async (_, args: { filter?: unknown; limit: number; offset: number }, ctx) => {
        const user = requireUser(ctx);
        const filter = parse(schemas.transactionFilter, args.filter) ?? {};
        const { limit, offset } = parse(schemas.page, { limit: args.limit, offset: args.offset });

        let query = user.db
          .from("transactions")
          .select(TRANSACTION_COLUMNS)
          .eq("user_id", user.userId)
          .order("occurred_on", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + limit - 1);
        if (filter.from) query = query.gte("occurred_on", filter.from);
        if (filter.to) query = query.lte("occurred_on", filter.to);
        if (filter.type) query = query.eq("type", filter.type);
        if (filter.categoryId) query = query.eq("category_id", filter.categoryId);

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
        await assertOwnCategory(user, input.categoryId);
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
        await assertOwnCategory(user, input.categoryId);
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
  },
});
