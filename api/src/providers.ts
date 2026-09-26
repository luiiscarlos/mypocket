// External market-data providers. All calls are server-side; keys never leave the API.
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY ?? "";
const TIMEOUT_MS = 8000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      console.warn("provider error", res.status, url.split("?")[0]);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn("provider unreachable", url.split("?")[0], (error as Error).message);
    return null;
  }
}

/** ISO 6166: 2 letters + 9 alphanumerics + Luhn check digit over the letter-expanded string. */
export function isValidIsin(value: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value)) return false;
  const digits = [...value].map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join("");
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export type Listing = {
  symbol: string;
  name: string;
  exchange: string;
  mic: string;
  currency: string;
  kind: "etf" | "stock" | "fund" | "other";
};

const KIND: Record<string, Listing["kind"]> = {
  ETF: "etf",
  "Common Stock": "stock",
  "Mutual Fund": "fund",
  "Depositary Receipt": "stock",
  "Preferred Stock": "stock",
};

/** Listings for an ISIN (Twelve Data search works without a key). Prefers EUR listings. */
export async function listingsForIsin(isin: string): Promise<Listing[]> {
  const res = await getJson<{ data?: Array<Record<string, string>> }>(
    `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(isin)}&outputsize=20`,
  );
  const listings = (res?.data ?? []).map((d) => ({
    symbol: d.symbol,
    name: d.instrument_name,
    exchange: d.exchange,
    mic: d.mic_code,
    currency: d.currency,
    kind: KIND[d.instrument_type] ?? "other",
  }));
  return listings.sort((a, b) => Number(b.currency === "EUR") - Number(a.currency === "EUR"));
}

/** Fallback name lookup when Twelve Data doesn't know the ISIN. */
export async function openFigiName(isin: string): Promise<{ name: string; ticker: string } | null> {
  const res = await getJson<Array<{ data?: Array<{ name: string; ticker: string }> }>>("https://api.openfigi.com/v3/mapping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ idType: "ID_ISIN", idValue: isin }]),
  });
  const first = res?.[0]?.data?.[0];
  return first ? { name: first.name, ticker: first.ticker } : null;
}

/**
 * Latest price in the listing's currency. GBp (pence) is converted to GBP.
 * Returns null without a valid TWELVE_DATA_API_KEY.
 */
export async function twelveDataPrice(symbol: string, mic: string, currency: string): Promise<{ price: number; currency: string } | null> {
  if (!TWELVE_DATA_KEY) return null;
  const res = await getJson<{ price?: string }>(
    `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&mic_code=${encodeURIComponent(mic)}&apikey=${TWELVE_DATA_KEY}`,
  );
  const price = Number(res?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return currency === "GBp" ? { price: price / 100, currency: "GBP" } : { price, currency };
}

export type Coin = { id: string; name: string; symbol: string };

export async function searchCoins(query: string): Promise<Coin[]> {
  const res = await getJson<{ coins?: Coin[] }>(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
  return (res?.coins ?? []).slice(0, 5).map(({ id, name, symbol }) => ({ id, name, symbol }));
}

/** EUR prices for CoinGecko ids, e.g. { bitcoin: 74071 }. */
export async function coinPricesEur(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const res = await getJson<Record<string, { eur?: number }>>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.map(encodeURIComponent).join(",")}&vs_currencies=eur`,
  );
  return Object.fromEntries(Object.entries(res ?? {}).flatMap(([id, v]) => (v.eur ? [[id, v.eur]] : [])));
}
