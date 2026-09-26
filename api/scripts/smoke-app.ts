// End-to-end check of the app API (onboarding, accounts, expenses, investments, net worth, simulations, updates).
// Usage: SMOKE_EMAIL=... SMOKE_PASSWORD=... pnpm --filter api smoke:app   (needs the API running and SUPABASE_SECRET_KEY on it)
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const apiUrl = process.env.API_URL ?? "http://localhost:4000/graphql";
const env = process.env;
assert(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && env.INTERNAL_API_SECRET && env.SMOKE_EMAIL && env.SMOKE_PASSWORD);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const { data: auth, error } = await supabase.auth.signInWithPassword({ email: env.SMOKE_EMAIL, password: env.SMOKE_PASSWORD });
assert(!error && auth.session, `login falló: ${error?.message}`);
const token = auth.session.access_token;

type Result = { data?: any; errors?: { message: string; extensions?: { code?: string } }[] };
async function gql(query: string, variables?: object): Promise<Result> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-internal-secret": env.INTERNAL_API_SECRET! },
    body: JSON.stringify({ query, variables }),
  });
  return res.json() as Promise<Result>;
}
const ok = (r: Result) => {
  assert(!r.errors, JSON.stringify(r.errors));
  return r.data;
};
const code = (r: Result) => r.errors?.[0]?.extensions?.code;

const cleanup: string[] = [];
try {
  // --- profile + onboarding ---
  ok(await gql(`mutation { setPlan(plan: FREE) { plan } }`));
  const me0 = ok(await gql("{ me { onboardingCompleted plan theme locale } }")).me;
  assert.equal(me0.plan, "FREE");
  assert.equal(code(await gql("mutation { completeOnboarding { id } }")), me0.onboardingCompleted ? undefined : "BAD_USER_INPUT");
  const profile = ok(await gql(`mutation {
    updateProfile(input: { fullName: "Smoke Tester", phone: "+34 600 000 000", city: "Madrid", country: "ES",
      birthDate: "1990-05-01", theme: DARK, locale: EN, notificationsEnabled: false }) {
      fullName phone city country birthDate theme locale notificationsEnabled } }`)).updateProfile;
  assert.deepEqual(profile, { fullName: "Smoke Tester", phone: "+34 600 000 000", city: "Madrid", country: "ES",
    birthDate: "1990-05-01", theme: "DARK", locale: "EN", notificationsEnabled: false });
  assert.equal(code(await gql(`mutation { updateProfile(input: { country: "Spain" }) { id } }`)), "BAD_USER_INPUT");
  assert.equal(ok(await gql("mutation { completeOnboarding { onboardingCompleted } }")).completeOnboarding.onboardingCompleted, true);

  // --- accounts + free-plan limit ---
  const bank = ok(await gql(`mutation { createAccount(input: { name: "Smoke BBVA", institution: "BBVA", kind: CHECKING, balance: 1500.5 }) { id balance kind } }`)).createAccount;
  cleanup.push(`mutation { deleteAccount(id: "${bank.id}") }`);
  const cash = ok(await gql(`mutation { createAccount(input: { name: "Smoke cash", kind: CASH, balance: 200 }) { id } }`)).createAccount;
  cleanup.push(`mutation { deleteAccount(id: "${cash.id}") }`);
  assert.equal(code(await gql(`mutation { createAccount(input: { name: "Smoke 2nd bank", kind: SAVINGS, balance: 1 }) { id } }`)), "PLAN_LIMIT");
  ok(await gql(`mutation { setPlan(plan: PRO) { plan } }`));
  const savings = ok(await gql(`mutation { createAccount(input: { name: "Smoke savings", kind: SAVINGS, balance: 3000 }) { id } }`)).createAccount;
  cleanup.push(`mutation { deleteAccount(id: "${savings.id}") }`);
  assert.equal(code(await gql(`mutation { setPlan(plan: FREE) { plan } }`)), "PLAN_LIMIT");

  // --- recurring expenses + upcoming payments ---
  const soon = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
  const later = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  const netflix = ok(await gql(`mutation { createRecurringExpense(input: { name: "Smoke Netflix", kind: SUBSCRIPTION, amount: 12.99, nextChargeDate: "${soon}", accountId: "${bank.id}" }) { id monthlyAmount } }`)).createRecurringExpense;
  cleanup.push(`mutation { deleteRecurringExpense(id: "${netflix.id}") }`);
  assert.equal(netflix.monthlyAmount, 12.99);
  const loan = ok(await gql(`mutation { createRecurringExpense(input: { name: "Smoke loan", kind: DEBT, amount: 240, intervalUnit: YEAR, nextChargeDate: "${later}", outstandingAmount: 5000 }) { id monthlyAmount } }`)).createRecurringExpense;
  cleanup.push(`mutation { deleteRecurringExpense(id: "${loan.id}") }`);
  assert.equal(loan.monthlyAmount, 20);
  const upcoming = ok(await gql("{ upcomingPayments(days: 30) { name } }")).upcomingPayments.map((e: any) => e.name);
  assert(upcoming.includes("Smoke Netflix") && !upcoming.includes("Smoke loan"), `upcoming: ${upcoming}`);

  // --- investments (real providers) ---
  const etf = ok(await gql(`{ searchInstruments(query: "IE00B4L5Y983") { id isin name kind currency lastPrice } }`)).searchInstruments;
  assert.equal(etf.length, 1);
  assert.equal(etf[0].isin, "IE00B4L5Y983");
  assert.equal(etf[0].kind, "ETF");
  console.log("ETF:", etf[0].name, etf[0].currency, "price:", etf[0].lastPrice ?? "(sin precio: falta TWELVE_DATA_API_KEY válida)");
  assert.equal(code(await gql(`{ searchInstruments(query: "IE00B4L5Y984") { id } }`)), undefined, "ISIN con dígito de control malo cae a búsqueda de texto");
  const btc = ok(await gql(`{ searchInstruments(query: "bitcoin") { id symbol kind lastPrice currency } }`)).searchInstruments.find((i: any) => i.symbol === "BTC");
  assert(btc && btc.kind === "CRYPTO" && btc.lastPrice > 0 && btc.currency === "EUR", JSON.stringify(btc));
  const holding = ok(await gql(`mutation { addInvestment(input: { instrumentId: "${btc.id}", quantity: 0.01 }) { id value currency instrument { symbol } } }`)).addInvestment;
  cleanup.push(`mutation { deleteInvestment(id: "${holding.id}") }`);
  assert.equal(holding.value, Math.round(btc.lastPrice * 0.01 * 100) / 100);

  // --- net worth ---
  const nw = ok(await gql("{ netWorth { totals { currency accounts investments debts total } debts { name } } }")).netWorth;
  const eur = nw.totals.find((t: any) => t.currency === "EUR");
  assert(eur.accounts >= 4700.5 && eur.investments >= holding.value && eur.debts >= 5000, JSON.stringify(eur));
  assert.equal(eur.total, Math.round((eur.accounts + eur.investments - eur.debts) * 100) / 100);

  // --- simulations ---
  const mortgage = ok(await gql(`{ simulate(kind: MORTGAGE, params: { price: 250000, downPayment: 50000, annualRate: 3, years: 30 }) { metrics { key value } series { period value } } }`)).simulate;
  assert.equal(mortgage.metrics.find((m: any) => m.key === "monthlyPayment").value, 843.21);
  assert.equal(code(await gql(`{ simulate(kind: LOAN, params: { amount: -1, annualRate: 3, years: 5 }) { metrics { key } } }`)), "BAD_USER_INPUT");
  const saved = ok(await gql(`mutation { saveSimulation(name: "Smoke casa", kind: MORTGAGE, params: { price: 250000, downPayment: 50000, annualRate: 3, years: 30 }) { id kind result { metrics { key value } } } }`)).saveSimulation;
  cleanup.push(`mutation { deleteSimulation(id: "${saved.id}") }`);
  assert.equal(ok(await gql("{ simulations { id } }")).simulations.some((s: any) => s.id === saved.id), true);

  // --- release notes ---
  const notes = ok(await gql(`{ appUpdates(locale: EN) { version title } }`)).appUpdates;
  assert.equal(notes[0].version, "0.1.0");
  assert.equal(notes[0].title, "First mypocket release");
} finally {
  for (const m of cleanup.reverse()) await gql(m);
  await gql(`mutation { setPlan(plan: FREE) { plan } }`);
}

console.log("smoke:app OK");
