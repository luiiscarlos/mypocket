import "server-only";
// Data loaders shared by the desktop app (/dashboard) and the mobile app (/mobile): each screen has its
// own UI, but the GraphQL reads (and the types they return) live here once.
import {
  ACCOUNT_FIELDS, EXPENSE_FIELDS, INVESTMENT_FIELDS, type Account, type Category, type Expense, type Investment,
} from "@/components/app/finance";
import type { Tx } from "@/components/app/transaction-form";
import { gql } from "@/lib/api";

export type Plan = "FREE" | "PRO";
export type Totals = { currency: string; accounts: number; investments: number; debts: number; current: number; endOfMonth: number; total: number };
export type ShellMe = {
  email: string | null; displayName: string | null; fullName: string | null; readOnly: boolean; onboardingCompleted: boolean; plan: Plan; isAdmin: boolean;
};
export type SettingsMe = {
  email: string | null; displayName: string | null; fullName: string | null; phone: string | null; addressLine: string | null;
  postalCode: string | null; city: string | null; country: string | null; birthDate: string | null; currency: string;
  plan: Plan; notificationsEnabled: boolean; readOnly: boolean;
};
export type Summary = {
  month: string;
  isEmpty: boolean;
  totals: { currency: string; income: number; expense: number; balance: number }[];
  byCategory: { category: { name: string } | null; type: "INCOME" | "EXPENSE"; currency: string; total: number; count: number }[];
};
export type TxFilter = { type?: "INCOME" | "EXPENSE"; accountId?: string; categoryId?: string; from?: string; to?: string };
export type TxOrder = "DATE_DESC" | "DATE_ASC" | "AMOUNT_DESC" | "AMOUNT_ASC";

export const getShellMe = () =>
  gql<{ me: ShellMe }>("{ me { email displayName fullName readOnly onboardingCompleted plan isAdmin } }").then((d) => d.me);

export const getHome = () =>
  gql<{
    me: { currency: string; readOnly: boolean; plan: Plan };
    netWorth: { totals: Totals[] };
    transactions: Tx[];
    upcomingPayments: Expense[];
    accounts: { id: string; name: string; balance: number; currency: string }[];
  }>(`{
    me { currency readOnly plan }
    netWorth { totals { currency accounts investments debts current endOfMonth total } }
    transactions(limit: 6) { id source type amount currency occurredOn note category { id name } accountId }
    upcomingPayments(days: 30) { ${EXPENSE_FIELDS} }
    accounts { id name balance currency }
  }`);

export const getNetWorth = () =>
  gql<{
    me: { currency: string; readOnly: boolean; plan: Plan };
    netWorth: { totals: Totals[] };
    accounts: Account[];
    investments: Investment[];
    recurringExpenses: Expense[];
    categories: Category[];
  }>(`{
    me { currency readOnly plan }
    netWorth { totals { currency accounts investments debts current endOfMonth total } }
    accounts { ${ACCOUNT_FIELDS} }
    investments { ${INVESTMENT_FIELDS} }
    recurringExpenses { ${EXPENSE_FIELDS} }
    categories { id name }
  }`);

export const getTransactions = (filter: TxFilter, orderBy: TxOrder, limit = 100) =>
  gql<{ me: { currency: string; readOnly: boolean }; categories: Category[]; accounts: { id: string; name: string; currency: string }[]; transactions: Tx[] }>(
    `query ($f: TransactionFilter, $o: TransactionOrder, $l: Int) {
      me { currency readOnly }
      categories { id name }
      accounts { id name currency }
      transactions(filter: $f, orderBy: $o, limit: $l) { id source type amount currency occurredOn note category { id name } accountId }
    }`,
    { f: filter, o: orderBy, l: limit },
  );

/** First day of the month `offset` months before `from` (YYYY-MM-01). */
export function monthStart(from: Date, offset: number) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - offset, 1)).toISOString().slice(0, 10);
}

/** The last `count` months (oldest first), one alias per month in a single request (the API allows 10). */
export async function getMonthlySummaries(count: number) {
  const now = new Date();
  const months = Array.from({ length: count }, (_, i) => monthStart(now, count - 1 - i));
  const fields = "month isEmpty totals { currency income expense balance } byCategory { category { name } type currency total count }";
  const query = `{ me { currency } ${months.map((m, i) => `m${i}: monthlySummary(month: "${m}") { ${fields} }`).join(" ")} }`;
  const data = await gql<Record<string, Summary> & { me: { currency: string } }>(query);
  return { months, currency: data.me.currency, summaries: months.map((_, i) => data[`m${i}`] as Summary) };
}

export const getPlan = () => gql<{ me: { plan: Plan } }>("{ me { plan } }").then((d) => d.me.plan);

export const getSettingsMe = () =>
  gql<{ me: SettingsMe }>(
    "{ me { email displayName fullName phone addressLine postalCode city country birthDate currency plan notificationsEnabled readOnly } }",
  ).then((d) => d.me);

export type Update = { version: string; publishedAt: string; title: string; body: string };
export const getUpdates = (locale: string) =>
  gql<{ appUpdates: Update[] }>("query ($l: Locale!) { appUpdates(locale: $l) { version publishedAt title body } }", { l: locale.toUpperCase() })
    .then((d) => d.appUpdates);

const TX_ORDERS = ["DATE_DESC", "DATE_ASC", "AMOUNT_DESC", "AMOUNT_ASC"] as const;
const TX_TYPES = ["INCOME", "EXPENSE"] as const;
const isDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const isId = (v: unknown) => (typeof v === "string" && /^\d{1,18}$/.test(v) ? v : undefined);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]) => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined);

/** Transaction filters from the URL. Only known values reach the API; anything else is ignored. */
export function parseTxSearch(sp: Record<string, string | string[] | undefined>) {
  const filter: TxFilter = {
    type: oneOf(sp.type, TX_TYPES),
    accountId: isId(sp.account),
    categoryId: isId(sp.category),
    from: isDate(sp.from),
    to: isDate(sp.to),
  };
  return { filter, orderBy: oneOf(sp.sort, TX_ORDERS) ?? ("DATE_DESC" as TxOrder), orders: TX_ORDERS, types: TX_TYPES };
}
