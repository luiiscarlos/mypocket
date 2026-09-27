// Local testing helper: creates (or reuses) a confirmed throwaway user in the DEV project and prints the
// Supabase SSR auth cookie for it, so pages behind login can be fetched with curl or a browser.
// Usage: pnpm --filter api exec tsx --env-file=.env.dev scripts/test-session.ts <email> <password> [--fresh]
// Never run against production: it refuses unless the URL is the dev project.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
const fresh = process.argv.includes("--fresh");
const { SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY } = process.env;
assert(email && password && SUPABASE_URL && SUPABASE_SECRET_KEY && SUPABASE_PUBLISHABLE_KEY, "usage: test-session.ts <email> <password>");
assert(SUPABASE_URL.includes("xojubupiixsnxvrijvoi"), "solo contra el proyecto dev");

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
const existing = list.users.find((u) => u.email === email);
if (existing && fresh) await admin.auth.admin.deleteUser(existing.id);
if (!existing || fresh) {
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert(!error, error?.message);
}

const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const { data, error } = await client.auth.signInWithPassword({ email, password });
assert(!error && data.session, error?.message);

// Same format @supabase/ssr writes: sb-<ref>-auth-token=base64-<base64url(JSON session)>
const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
const value = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64url");
// Long values are split like @supabase/ssr does (name.0, name.1, …; 3180 chars each).
const name = `sb-${ref}-auth-token`;
const chunks = value.match(/.{1,3180}/g)!;
console.log(chunks.length === 1 ? `${name}=${value}` : chunks.map((c, i) => `${name}.${i}=${c}`).join("; "));
