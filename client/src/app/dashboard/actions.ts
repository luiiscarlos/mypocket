"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { gql } from "@/lib/api";
import { attempt, backOf, backWith, num, optional, text } from "@/lib/app-actions";
import { requireUser, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Every action: verified session → API call (which re-checks auth, ownership and input) → back to the form
// with a message code. Money fields are validated here only to give a friendly error before the API does.

async function mutate(back: string, query: string, variables: Record<string, unknown>) {
  await requireUser();
  await attempt(back, () => gql(query, variables));
  revalidatePath("/dashboard", "layout");
}

const invalidIf = (back: string, bad: boolean) => {
  if (bad) backWith(back, { error: "invalid" });
};

// --- accounts -------------------------------------------------------------------------------

export async function createAccount(formData: FormData) {
  const back = backOf(formData);
  const balance = num(formData, "balance");
  invalidIf(back, Number.isNaN(balance));
  await mutate(back, `mutation ($i: AccountInput!) { createAccount(input: $i) { id } }`, {
    i: {
      name: text(formData, "name"),
      institution: optional(text(formData, "institution")),
      kind: text(formData, "kind"),
      currency: optional(text(formData, "currency").toUpperCase()),
      balance,
    },
  });
  backWith(back, { message: "saved" });
}

export async function updateAccountBalance(formData: FormData) {
  const back = backOf(formData);
  const balance = num(formData, "balance");
  invalidIf(back, Number.isNaN(balance));
  await mutate(back, `mutation ($id: ID!, $i: UpdateAccountInput!) { updateAccount(id: $id, input: $i) { id } }`, {
    id: text(formData, "id"),
    i: { balance },
  });
  backWith(back, { message: "saved" });
}

export async function deleteAccount(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($id: ID!) { deleteAccount(id: $id) }`, { id: text(formData, "id") });
  backWith(back, { message: "deleted" });
}

// --- recurring expenses (subscriptions, debts) --------------------------------------------------

export async function createExpense(formData: FormData) {
  const back = backOf(formData);
  const amount = num(formData, "amount");
  const outstanding = text(formData, "outstandingAmount");
  const outstandingAmount = outstanding ? num(formData, "outstandingAmount") : null;
  invalidIf(back, Number.isNaN(amount) || Number.isNaN(outstandingAmount));
  await mutate(back, `mutation ($i: RecurringExpenseInput!) { createRecurringExpense(input: $i) { id } }`, {
    i: {
      name: text(formData, "name"),
      kind: text(formData, "kind"),
      amount,
      intervalUnit: text(formData, "intervalUnit") || "MONTH",
      nextChargeDate: text(formData, "nextChargeDate"),
      outstandingAmount,
      accountId: optional(text(formData, "accountId")),
    },
  });
  backWith(back, { message: "saved" });
}

export async function deleteExpense(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($id: ID!) { deleteRecurringExpense(id: $id) }`, { id: text(formData, "id") });
  backWith(back, { message: "deleted" });
}

// --- investments --------------------------------------------------------------------------------

export async function addInvestment(formData: FormData) {
  const back = backOf(formData);
  const quantity = num(formData, "quantity");
  invalidIf(back, !(quantity > 0));
  await mutate(back, `mutation ($i: InvestmentInput!) { addInvestment(input: $i) { id } }`, {
    i: { instrumentId: text(formData, "instrumentId"), quantity },
  });
  // Drop the search (?q=) once the holding is added.
  const url = new URL(back, "http://local");
  url.searchParams.delete("q");
  backWith(url.pathname + url.search, { message: "saved" });
}

export async function deleteInvestment(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($id: ID!) { deleteInvestment(id: $id) }`, { id: text(formData, "id") });
  backWith(back, { message: "deleted" });
}

// --- transactions -------------------------------------------------------------------------------

export async function createTransaction(formData: FormData) {
  const back = backOf(formData);
  const amount = num(formData, "amount");
  invalidIf(back, !(amount > 0));
  await mutate(back, `mutation ($i: CreateTransactionInput!) { createTransaction(input: $i) { id } }`, {
    i: {
      type: text(formData, "type"),
      amount,
      currency: optional(text(formData, "currency").toUpperCase()),
      categoryId: optional(text(formData, "categoryId")),
      accountId: optional(text(formData, "accountId")),
      occurredOn: optional(text(formData, "occurredOn")),
      note: optional(text(formData, "note")),
    },
  });
  backWith(back, { message: "saved" });
}

export async function deleteTransaction(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($id: ID!) { deleteTransaction(id: $id) }`, { id: text(formData, "id") });
  backWith(back, { message: "deleted" });
}

// --- simulations --------------------------------------------------------------------------------

export async function saveSimulation(formData: FormData) {
  const back = backOf(formData);
  let params: unknown;
  try {
    params = JSON.parse(text(formData, "params"));
  } catch {
    backWith(back, { error: "invalid" });
  }
  await mutate(back, `mutation ($n: String!, $k: SimulationKind!, $p: JSON!) { saveSimulation(name: $n, kind: $k, params: $p) { id } }`, {
    n: text(formData, "name"),
    k: text(formData, "kind"),
    p: params,
  });
  backWith(back, { message: "saved" });
}

export async function deleteSimulation(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($id: ID!) { deleteSimulation(id: $id) }`, { id: text(formData, "id") });
  backWith(back, { message: "deleted" });
}

// --- profile, plan, preferences -----------------------------------------------------------------

const PROFILE_FIELDS = ["displayName", "fullName", "phone", "addressLine", "postalCode", "city", "country", "birthDate", "currency"] as const;

/** Saves the profile fields present in the form; an empty optional field is cleared. */
export async function updateProfile(formData: FormData) {
  const back = backOf(formData);
  const input: Record<string, string | null> = {};
  for (const field of PROFILE_FIELDS) {
    if (!formData.has(field)) continue;
    const value = text(formData, field);
    input[field] = field === "currency" || field === "country" ? value.toUpperCase() || null : optional(value);
  }
  await mutate(back, `mutation ($i: UpdateProfileInput!) { updateProfile(input: $i) { id } }`, { i: input });
  // Onboarding forms say where to go next; settings stay on the page.
  const next = text(formData, "next");
  if (next) redirect(safeNext(next, back));
  backWith(back, { message: "saved" });
}

export async function setNotifications(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($i: UpdateProfileInput!) { updateProfile(input: $i) { id } }`, {
    i: { notificationsEnabled: text(formData, "enabled") === "true" },
  });
  backWith(back, { message: "saved" });
}

export async function setPlan(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation ($p: Plan!) { setPlan(plan: $p) { plan } }`, { p: text(formData, "plan") });
  backWith(back, { message: "planChanged" });
}

export async function completeOnboarding(formData: FormData) {
  const back = backOf(formData);
  await mutate(back, `mutation { completeOnboarding { onboardingCompleted } }`, {});
  redirect("/dashboard?message=welcome");
}

// --- security and account -----------------------------------------------------------------------

export async function changePassword(formData: FormData) {
  const back = backOf(formData);
  const user = await requireUser();
  const password = text(formData, "password");
  if (password.length < 8) backWith(back, { error: "passwordShort" });
  if (password !== text(formData, "confirm")) backWith(back, { error: "passwordMismatch" });

  const supabase = await createClient();
  // Re-checking the current password also makes the session "recent", which Supabase's
  // "Secure password change" requires before updateUser({ password }).
  const { error: wrong } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: text(formData, "current") });
  if (wrong) backWith(back, { error: "passwordWrong" });

  // The demo account is read-only; its password must not change either.
  const { me } = await gql<{ me: { readOnly: boolean } }>("{ me { readOnly } }");
  if (me.readOnly) backWith(back, { error: "readOnly" });

  const { error } = await supabase.auth.updateUser({ password });
  if (error) backWith(back, { error: "generic" });
  backWith(back, { message: "passwordChanged" });
}

export async function deleteMyAccount(formData: FormData) {
  const back = backOf(formData);
  await requireUser();
  const word = (await getTranslations("app.settings.delete"))("word");
  if (text(formData, "confirm").toUpperCase() !== word.toUpperCase()) backWith(back, { error: "confirmDelete" });
  await attempt(back, () => gql("mutation { deleteMyAccount }"));
  // The API already revoked every session; this clears the local cookies.
  await (await createClient()).auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/login?message=account_deleted");
}
