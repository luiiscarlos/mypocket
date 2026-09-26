import { z } from "zod";
import { GraphQLError } from "graphql";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientError, fail, requireAdmin, requireUser, requireWritable, round2, type AuthedUser, type Context, type Module } from "../core.js";
import { parse, primitives as p } from "../validation.js";
import { rateLimit } from "../rate-limit.js";
import { coinPricesEur, isValidIsin, listingsForIsin, openFigiName, searchCoins, twelveDataPrice } from "../providers.js";

const typeDefs = /* GraphQL */ `
  enum InstrumentKind { ETF STOCK FUND CRYPTO OTHER }

  type Instrument {
    id: ID!
    isin: String
    symbol: String!
    name: String!
    kind: InstrumentKind!
    currency: String!
    exchange: String
    "Null until a price provider answers (e.g. no Twelve Data key)."
    lastPrice: Float
    priceUpdatedAt: String
  }

  type Investment {
    id: ID!
    instrument: Instrument!
    quantity: Float!
    costBasis: Float
    "quantity × lastPrice, in the instrument currency; null without a price."
    value: Float
    currency: String!
  }

  input InvestmentInput {
    instrumentId: ID!
    quantity: Float!
    "Total amount paid, optional."
    costBasis: Float
  }

  input UpdateInvestmentInput {
    quantity: Float
    costBasis: Float
  }

  extend type Query {
    investments: [Investment!]!
    "An ISIN (ETFs, stocks, funds) or a name/symbol (crypto, e.g. 'bitcoin'). Results are cached."
    searchInstruments(query: String!): [Instrument!]!
  }

  extend type Mutation {
    addInvestment(input: InvestmentInput!): Investment!
    updateInvestment(id: ID!, input: UpdateInvestmentInput!): Investment!
    deleteInvestment(id: ID!): ID!
  }
`;

const PRICE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_REFRESH_PER_REQUEST = 8; // Twelve Data free tier: 8 requests/minute

type InstrumentRow = {
  id: number; isin: string | null; symbol: string; name: string; kind: string; currency: string;
  exchange: string | null; provider: "twelvedata" | "coingecko"; provider_id: string;
  last_price: number | null; price_updated_at: string | null;
};
type InvestmentRow = { id: number; quantity: number; cost_basis: number | null; instrument: InstrumentRow };

const INSTRUMENT_COLUMNS = "id, isin, symbol, name, kind, currency, exchange, provider, provider_id, last_price, price_updated_at";
const INVESTMENT_COLUMNS = `id, quantity, cost_basis, instrument:instruments(${INSTRUMENT_COLUMNS})`;

const toInstrument = (i: InstrumentRow) => ({
  id: i.id, isin: i.isin, symbol: i.symbol, name: i.name, kind: i.kind, currency: i.currency,
  exchange: i.exchange, lastPrice: i.last_price === null ? null : Number(i.last_price), priceUpdatedAt: i.price_updated_at,
});

const toInvestment = (row: InvestmentRow) => {
  const instrument = toInstrument(row.instrument);
  const quantity = Number(row.quantity);
  return {
    id: row.id,
    instrument,
    quantity,
    costBasis: row.cost_basis === null ? null : Number(row.cost_basis),
    value: instrument.lastPrice === null ? null : round2(quantity * instrument.lastPrice),
    currency: instrument.currency,
  };
};

const isStale = (i: InstrumentRow) => !i.price_updated_at || Date.now() - Date.parse(i.price_updated_at) > PRICE_TTL_MS;

const quantity = z.number().positive().max(1e12);
const costBasis = z.number().min(0).max(1e12).multipleOf(0.01).nullable();
const schemas = {
  query: z.string().trim().min(2).max(60),
  add: z.object({ instrumentId: p.id, quantity, costBasis: costBasis.optional() }),
  update: z.object({ quantity, costBasis }).partial().refine(p.atLeastOneField, "no hay campos que actualizar"),
};

/** Refresh stale prices of the given instruments (shared cache, written with the secret key). */
async function refreshPrices(admin: SupabaseClient, rows: InstrumentRow[]): Promise<Map<number, InstrumentRow>> {
  const fresh = new Map<number, InstrumentRow>();
  const stale = rows.filter(isStale).slice(0, MAX_REFRESH_PER_REQUEST);
  const now = new Date().toISOString();

  const coins = stale.filter((r) => r.provider === "coingecko");
  const prices = await coinPricesEur(coins.map((c) => c.provider_id));
  const updates: Array<Pick<InstrumentRow, "id" | "last_price" | "currency">> = [];
  for (const c of coins) if (prices[c.provider_id]) updates.push({ id: c.id, last_price: prices[c.provider_id], currency: "EUR" });

  for (const r of stale.filter((r) => r.provider === "twelvedata")) {
    const [symbol, mic] = r.provider_id.split(":");
    const quote = await twelveDataPrice(symbol, mic, r.currency);
    if (quote) updates.push({ id: r.id, last_price: quote.price, currency: quote.currency });
  }

  for (const u of updates) {
    const { data, error } = await admin
      .from("instruments")
      .update({ last_price: u.last_price, currency: u.currency, price_updated_at: now })
      .eq("id", u.id)
      .select(INSTRUMENT_COLUMNS)
      .single<InstrumentRow>();
    if (!error && data) fresh.set(data.id, data);
  }
  return fresh;
}

/** Holdings with current values; refreshes stale prices when the API has the secret key. */
export async function investmentValues(ctx: Context, user: AuthedUser) {
  const { data, error } = await user.db
    .from("investments")
    .select(INVESTMENT_COLUMNS)
    .eq("user_id", user.userId)
    .order("id")
    .overrideTypes<InvestmentRow[], { merge: false }>();
  if (error) fail(error);
  if (ctx.admin) {
    const fresh = await refreshPrices(ctx.admin, data.map((d) => d.instrument));
    for (const d of data) d.instrument = fresh.get(d.instrument.id) ?? d.instrument;
  }
  return data.map(toInvestment);
}

async function searchByIsin(admin: SupabaseClient, isin: string): Promise<InstrumentRow[]> {
  const { data: cached, error } = await admin.from("instruments").select(INSTRUMENT_COLUMNS).eq("isin", isin).maybeSingle<InstrumentRow>();
  if (error) fail(error);
  if (cached) {
    const fresh = await refreshPrices(admin, [cached]);
    return [fresh.get(cached.id) ?? cached];
  }

  const [best] = await listingsForIsin(isin);
  let row: Omit<InstrumentRow, "id">;
  if (best) {
    const quote = await twelveDataPrice(best.symbol, best.mic, best.currency);
    row = {
      isin, symbol: best.symbol, name: best.name, kind: best.kind, exchange: best.exchange,
      currency: quote?.currency ?? (best.currency === "GBp" ? "GBP" : best.currency),
      provider: "twelvedata", provider_id: `${best.symbol}:${best.mic}`,
      last_price: quote?.price ?? null, price_updated_at: quote ? new Date().toISOString() : null,
    };
  } else {
    const figi = await openFigiName(isin);
    if (!figi) return [];
    // Known by OpenFIGI but not by the price provider: name only, no price.
    row = {
      isin, symbol: figi.ticker, name: figi.name, kind: "other", exchange: null, currency: "EUR",
      provider: "twelvedata", provider_id: `${figi.ticker}:UNKNOWN`, last_price: null, price_updated_at: null,
    };
  }
  const { data, error: insertError } = await admin
    .from("instruments")
    .upsert(row, { onConflict: "provider,provider_id" })
    .select(INSTRUMENT_COLUMNS)
    .single<InstrumentRow>();
  if (insertError) fail(insertError);
  return [data];
}

async function searchCrypto(admin: SupabaseClient, query: string): Promise<InstrumentRow[]> {
  const coins = await searchCoins(query);
  if (coins.length === 0) return [];
  const prices = await coinPricesEur(coins.map((c) => c.id));
  const now = new Date().toISOString();
  const rows = coins.map((c) => ({
    isin: null, symbol: c.symbol.toUpperCase().slice(0, 30), name: c.name.slice(0, 200), kind: "crypto", currency: "EUR",
    exchange: null, provider: "coingecko" as const, provider_id: c.id,
    last_price: prices[c.id] ?? null, price_updated_at: prices[c.id] ? now : null,
  }));
  const { data, error } = await admin
    .from("instruments")
    .upsert(rows, { onConflict: "provider,provider_id" })
    .select(INSTRUMENT_COLUMNS)
    .overrideTypes<InstrumentRow[], { merge: false }>();
  if (error) fail(error);
  return data;
}

async function getInvestment(user: AuthedUser, id: number) {
  const { data, error } = await user.db
    .from("investments")
    .select(INVESTMENT_COLUMNS)
    .eq("id", id)
    .eq("user_id", user.userId)
    .single<InvestmentRow>();
  if (error) fail(error);
  return toInvestment(data);
}

export const investments: Module = {
  typeDefs,
  resolvers: {
    InstrumentKind: { ETF: "etf", STOCK: "stock", FUND: "fund", CRYPTO: "crypto", OTHER: "other" },

    Query: {
      investments: (_, __, ctx) => investmentValues(ctx, requireUser(ctx)),

      searchInstruments: async (_, args: { query: string }, ctx) => {
        const user = requireUser(ctx);
        const query = parse(schemas.query, args.query);
        const retryAfter = rateLimit(`search:${user.userId}`, 20);
        if (retryAfter !== null) {
          throw new GraphQLError("Demasiadas búsquedas, prueba en un momento", {
            extensions: { code: "RATE_LIMITED", http: { status: 429, headers: { "Retry-After": String(retryAfter) } } },
          });
        }
        const admin = requireAdmin(ctx);
        const isin = query.toUpperCase().replace(/\s/g, "");
        const rows = isValidIsin(isin) ? await searchByIsin(admin, isin) : await searchCrypto(admin, query);
        return rows.map(toInstrument);
      },
    },

    Mutation: {
      addInvestment: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.add, args.input);
        const { data, error } = await user.db
          .from("investments")
          .insert({ user_id: user.userId, instrument_id: input.instrumentId, quantity: input.quantity, cost_basis: input.costBasis ?? null })
          .select("id")
          .single<{ id: number }>();
        if (error) fail(error);
        return getInvestment(user, data.id);
      },

      updateInvestment: async (_, args: { id: string; input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const input = parse(schemas.update, args.input);
        const row = Object.fromEntries(
          Object.entries({ quantity: input.quantity, cost_basis: input.costBasis }).filter(([, v]) => v !== undefined),
        );
        const { error } = await user.db.from("investments").update(row).eq("id", id).eq("user_id", user.userId).select("id").single();
        if (error) fail(error);
        return getInvestment(user, id);
      },

      deleteInvestment: async (_, args: { id: string }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const { data, error } = await user.db.from("investments").delete().eq("id", id).eq("user_id", user.userId).select("id");
        if (error) fail(error);
        if (data.length === 0) throw clientError("No encontrado", "NOT_FOUND");
        return id;
      },
    },
  },
};
