// End-to-end check of the API against a running server and a real Supabase project (use dev).
// Usage: SMOKE_EMAIL=... SMOKE_PASSWORD=... pnpm --filter api smoke
//   SMOKE_DELETE=1 also tests deleteMyAccount (deletes the smoke user; needs SUPABASE_SECRET_KEY on the API).
//   SMOKE_RO_EMAIL / SMOKE_RO_PASSWORD: a read_only user, to check writes are rejected.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const apiUrl = process.env.API_URL ?? "http://localhost:4000/graphql";
const env = process.env;
assert(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && env.INTERNAL_API_SECRET, "faltan variables del .env");
assert(env.SMOKE_EMAIL && env.SMOKE_PASSWORD, "faltan SMOKE_EMAIL / SMOKE_PASSWORD");

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  assert(!error && data.session, `login ${email} falló: ${error?.message}`);
  return data.session.access_token;
}
const token = await login(env.SMOKE_EMAIL, env.SMOKE_PASSWORD);

type GqlError = { message: string; extensions?: { code?: string; fields?: { path: string }[] } };
type Result = { status: number; data?: any; errors?: GqlError[]; retryAfter: string | null };
const seenErrors: string[] = [];

async function gql(
  query: string,
  variables?: object,
  opts: { bearer?: string | null; secret?: string | null; ip?: string } = {},
): Promise<Result> {
  const bearer = opts.bearer === undefined ? token : opts.bearer;
  const secret = opts.secret === undefined ? env.INTERNAL_API_SECRET : opts.secret;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer && { Authorization: `Bearer ${bearer}` }),
      ...(secret && { "x-internal-secret": secret }),
      ...(opts.ip && { "x-client-ip": opts.ip }),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as Result;
  for (const e of body.errors ?? []) seenErrors.push(e.message);
  return { ...body, status: res.status, retryAfter: res.headers.get("retry-after") };
}
const code = (r: Result) => r.errors?.[0]?.extensions?.code;
const ok = (r: Result) => {
  assert(!r.errors, JSON.stringify(r.errors));
  return r.data;
};
const TX = "id type amount currency occurredOn note source category { id name }";

// --- access control -------------------------------------------------------------
assert.equal((await gql("{ health }", undefined, { secret: null, bearer: null })).status, 401, "sin secreto debe dar 401");
assert.equal((await gql("{ health }", undefined, { secret: "x".repeat(43), bearer: null })).status, 401);
assert.equal(ok(await gql("{ health }", undefined, { bearer: null })).health, "ok");
assert.equal(code(await gql("{ me { id } }", undefined, { bearer: null })), "UNAUTHENTICATED");
assert.equal((await gql("{ me { id } }", undefined, { bearer: "garbage" })).status, 401);
assert.equal((await fetch(apiUrl.replace("/graphql", "/health"))).status, 200);

// --- query hardening --------------------------------------------------------------
const aliases = Array.from({ length: 11 }, (_, i) => `a${i}: health`).join(" ");
assert((await gql(`{ ${aliases} }`)).errors, "11 aliases deberían rechazarse");
assert((await gql("{ healt }")).errors?.every((e) => !/Did you mean/.test(e.message)), "no debe sugerir campos");

// --- profile ------------------------------------------------------------------------
const me = ok(await gql("{ me { id email accountType isOwner readOnly currency } }")).me;
assert.deepEqual(
  { email: me.email, accountType: me.accountType, isOwner: me.isOwner, readOnly: me.readOnly },
  { email: env.SMOKE_EMAIL, accountType: "DEMO", isOwner: false, readOnly: false },
);
const renamed = ok(await gql(`mutation { updateProfile(input: { displayName: "Smoke", currency: "EUR" }) { displayName currency } }`));
assert.deepEqual(renamed.updateProfile, { displayName: "Smoke", currency: "EUR" });
assert.equal(code(await gql(`mutation { updateProfile(input: { currency: "euro" }) { id } }`)), "BAD_USER_INPUT");

// --- categories ---------------------------------------------------------------------
const cats = ok(await gql("{ categories { id name } }")).categories;
assert.equal(cats.length, 8, "8 categorías por defecto");
const food = cats.find((c: any) => c.name === "Alimentación");

const created = ok(await gql(`mutation { createCategory(input: { name: "Smoke cat", color: "#ff0000" }) { id name color } }`));
const catId = created.createCategory.id;
assert.equal(code(await gql(`mutation { createCategory(input: { name: "Smoke cat" }) { id } }`)), "CONFLICT");
assert.equal(code(await gql(`mutation { createCategory(input: { name: "x", color: "red" }) { id } }`)), "BAD_USER_INPUT");
assert.equal(
  ok(await gql(`mutation($id: ID!) { updateCategory(id: $id, input: { name: "Smoke renamed" }) { name } }`, { id: catId }))
    .updateCategory.name,
  "Smoke renamed",
);

// --- transactions + summary --------------------------------------------------------
const empty = ok(await gql(`{ monthlySummary(month: "2020-02-10") { month isEmpty totals { currency } byCategory { total } } }`));
assert.deepEqual(empty.monthlySummary, { month: "2020-02", isEmpty: true, totals: [], byCategory: [] });

const create = (input: object) => gql(`mutation($i: CreateTransactionInput!) { createTransaction(input: $i) { ${TX} } }`, { i: input });
const tx1 = ok(await create({ type: "EXPENSE", amount: 12.5, categoryId: food.id, occurredOn: "2020-01-15", note: "smoke" })).createTransaction;
const tx2 = ok(await create({ type: "EXPENSE", amount: 7.25, categoryId: catId, occurredOn: "2020-01-20" })).createTransaction;
const tx3 = ok(await create({ type: "INCOME", amount: 1000, occurredOn: "2020-01-01" })).createTransaction;
assert.deepEqual(
  { type: tx1.type, amount: tx1.amount, currency: tx1.currency, source: tx1.source, category: tx1.category.name },
  { type: "EXPENSE", amount: 12.5, currency: "EUR", source: "MANUAL", category: "Alimentación" },
);

const bad = await create({ type: "INCOME", amount: -5, occurredOn: "nope" });
assert.equal(code(bad), "BAD_USER_INPUT");
assert.deepEqual(bad.errors![0].extensions!.fields!.map((f) => f.path).sort(), ["amount", "occurredOn"]);
assert.equal(code(await create({ type: "INCOME", amount: 1.234 })), "BAD_USER_INPUT", "máximo 2 decimales");
assert.equal(code(await create({ type: "INCOME", amount: 1, categoryId: "999999999" })), "BAD_USER_INPUT");

const jan = ok(await gql(`{ transactions(filter: { from: "2020-01-01", to: "2020-01-31", type: EXPENSE }) { id } }`));
assert.deepEqual(jan.transactions.map((t: any) => t.id).sort(), [tx1.id, tx2.id].sort());
assert.equal(code(await gql(`{ transactions(limit: 500) { id } }`)), "BAD_USER_INPUT");

const updated = ok(
  await gql(`mutation($id: ID!) { updateTransaction(id: $id, input: { amount: 20, categoryId: null }) { ${TX} } }`, { id: tx1.id }),
).updateTransaction;
assert.deepEqual({ amount: updated.amount, category: updated.category, note: updated.note }, { amount: 20, category: null, note: "smoke" });
assert.equal(code(await gql(`mutation($id: ID!) { updateTransaction(id: $id, input: {}) { id } }`, { id: tx1.id })), "BAD_USER_INPUT");

const summary = ok(
  await gql(`{ monthlySummary(month: "2020-01-31") { isEmpty totals { currency income expense balance } byCategory { category { name } type total count } } }`),
).monthlySummary;
assert.equal(summary.isEmpty, false);
assert.deepEqual(summary.totals, [{ currency: "EUR", income: 1000, expense: 27.25, balance: 972.75 }]);
assert.equal(summary.byCategory.length, 3);

const exported = JSON.parse(ok(await gql("{ exportMyData }")).exportMyData);
assert.equal(exported.transactions.length, 3);
assert.equal(exported.categories.length, 9);

// deleting a category keeps its transactions, without category
assert.equal(ok(await gql(`mutation($id: ID!) { deleteCategory(id: $id) }`, { id: catId })).deleteCategory, catId);
assert.equal(ok(await gql(`query($id: ID!) { transaction(id: $id) { category { id } } }`, { id: tx2.id })).transaction.category, null);

for (const t of [tx1, tx2, tx3]) {
  assert.equal(ok(await gql(`mutation($id: ID!) { deleteTransaction(id: $id) }`, { id: t.id })).deleteTransaction, t.id);
}
assert.equal(code(await gql(`mutation($id: ID!) { deleteTransaction(id: $id) }`, { id: tx1.id })), "NOT_FOUND");

// --- read-only account (optional) -------------------------------------------------
if (env.SMOKE_RO_EMAIL && env.SMOKE_RO_PASSWORD) {
  const ro = await login(env.SMOKE_RO_EMAIL, env.SMOKE_RO_PASSWORD);
  assert.equal(ok(await gql("{ me { readOnly } }", undefined, { bearer: ro })).me.readOnly, true);
  assert.equal(ok(await gql("{ categories { id } }", undefined, { bearer: ro })).categories.length > 0, true);
  assert.equal(code(await gql(`mutation { createCategory(input: { name: "hack" }) { id } }`, undefined, { bearer: ro })), "FORBIDDEN");
  assert.equal(code(await gql(`mutation { deleteMyAccount }`, undefined, { bearer: ro })), "FORBIDDEN");
  console.log("read-only OK");
}

// --- no internals leaked ------------------------------------------------------------
const leaks = seenErrors.filter((m) => /violates|constraint|relation|column|public\.|PGRST|duplicate key|postgres/i.test(m));
assert.deepEqual(leaks, [], "un error filtra detalles internos");

// --- rate limit (own IP bucket, so it does not affect the user above) -------------
let limited: Result | undefined;
for (let i = 0; i < 125 && !limited; i++) {
  const r = await gql("{ health }", undefined, { bearer: null, ip: "smoke-burst" });
  if (r.status === 429) limited = r;
}
assert(limited, "debería devolver 429 tras 120 peticiones/min");
assert.equal(code(limited), "RATE_LIMITED");
assert(Number(limited.retryAfter) > 0, "falta Retry-After");

// --- account deletion (optional, destroys the smoke user) --------------------------
if (env.SMOKE_DELETE) {
  assert.equal(ok(await gql("mutation { deleteMyAccount }")).deleteMyAccount, true);
  const { error } = await supabase.auth.signInWithPassword({ email: env.SMOKE_EMAIL, password: env.SMOKE_PASSWORD });
  assert(error, "el usuario borrado no debería poder iniciar sesión");
  console.log("deleteMyAccount OK");
}

console.log("smoke OK");
