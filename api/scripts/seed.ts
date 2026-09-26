// Seeds a user with ~6 months of synthetic transactions. Idempotent: replaces that user's transactions.
// Usage: pnpm --filter api seed -- --email dev@example.com --password '...' [--demo] [--months 6]
//   --demo marks the account read_only (public portfolio account). Without --demo it refuses to touch prod.
// Needs SUPABASE_URL and SUPABASE_SECRET_KEY in api/.env.
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const PROD_REF = "aiaozxjwgschdeghicho";

const { values: args } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    demo: { type: "boolean", default: false },
    months: { type: "string", default: "6" },
  },
});
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SECRET_KEY");
if (!args.email || !args.password) throw new Error("Uso: --email <email> --password <password> [--demo]");
if (SUPABASE_URL.includes(PROD_REF) && !args.demo) throw new Error("En prod solo se permite el seed de la cuenta demo (--demo)");

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

async function findOrCreateUser(email: string, password: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  // email_confirm: the seed user skips verification; the signup trigger creates profile + categories.
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

// Deterministic PRNG so every seed produces the same data.
let state = 42;
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
const iso = (d: Date) => d.toISOString().slice(0, 10);

const userId = await findOrCreateUser(args.email, args.password);

const { data: categories, error: catError } = await admin.from("categories").select("id, name").eq("user_id", userId);
if (catError) throw catError;
const cat = (name: string) => categories.find((c) => c.name === name)?.id ?? null;

type Row = { user_id: string; type: "income" | "expense"; amount: number; category_id: number | null; occurred_on: string; note: string };
const rows: Row[] = [];
const add = (type: Row["type"], amount: number, category: string, day: Date, note: string) =>
  rows.push({ user_id: userId, type, amount, category_id: cat(category), occurred_on: iso(day), note });

const today = new Date();
for (let m = Number(args.months) - 1; m >= 0; m--) {
  const month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - m, 1));
  const day = (d: number) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), d));
  const lastDay = m === 0 ? today.getUTCDate() : 28;

  add("income", between(1900, 2100), "Nómina", day(1), "Nómina");
  add("expense", 750, "Vivienda", day(Math.min(3, lastDay)), "Alquiler");
  add("expense", between(45, 70), "Vivienda", day(Math.min(10, lastDay)), "Luz");
  for (const [name, price, d] of [["Netflix", 12.99, 5], ["Spotify", 10.99, 12], ["Gimnasio", 35, 2]] as const) {
    if (d <= lastDay) add("expense", price, "Suscripciones", day(d), name);
  }
  for (let d = 4; d <= lastDay; d += 7) add("expense", between(35, 110), "Alimentación", day(d), "Supermercado");
  for (let i = 0; i < 4; i++) add("expense", between(8, 40), "Transporte", day(1 + Math.floor(rand() * lastDay)), "Transporte");
  for (let i = 0; i < 3; i++) add("expense", between(15, 60), "Ocio", day(1 + Math.floor(rand() * lastDay)), "Ocio");
  if (rand() < 0.4) add("expense", between(20, 80), "Salud", day(1 + Math.floor(rand() * lastDay)), "Farmacia");
}

const { error: delError } = await admin.from("transactions").delete().eq("user_id", userId);
if (delError) throw delError;
const { error: insError } = await admin.from("transactions").insert(rows);
if (insError) throw insError;

const { error: profileError } = await admin
  .from("profiles")
  .update({ read_only: args.demo, display_name: args.demo ? "Demo" : null })
  .eq("id", userId);
if (profileError) throw profileError;

console.log(`seed OK: ${args.email} (${userId}) → ${rows.length} transacciones${args.demo ? ", cuenta demo de solo lectura" : ""}`);
