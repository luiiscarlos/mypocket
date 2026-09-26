"use server";

import type { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import type { AuthErrorCode, AuthMessageCode } from "@/lib/auth-codes";

const MIN_PASSWORD = 8;

// Pages receive codes, never text: they translate the code, so the URL can't inject arbitrary copy.
const back = (path: string, params: { error?: AuthErrorCode; message?: AuthMessageCode; next?: string }) =>
  redirect(`${path}?${new URLSearchParams(params as Record<string, string>)}`);

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// Known Supabase Auth errors → our codes; the raw error goes to the server log.
function authErrorCode(error: AuthError, fallback: AuthErrorCode): AuthErrorCode {
  console.error("supabase auth error:", error.code, error.status, error.message);
  switch (error.code) {
    case "weak_password":
      return "weak_password";
    case "same_password":
      return "same_password";
    case "email_address_invalid":
      return "email_invalid";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rate_limited";
    case "signup_disabled":
      return "signup_disabled";
    default:
      return (error.status ?? 0) >= 500 ? "email_send_failed" : fallback;
  }
}

async function origin() {
  return (await headers()).get("origin") ?? process.env.SITE_URL ?? "";
}

export async function login(formData: FormData) {
  const email = field(formData, "email");
  const password = formData.get("password");
  const next = safeNext(formData.get("next"));
  if (!email || typeof password !== "string" || !password) back("/login", { error: "missing_credentials", next });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: password as string });
  if (error) back("/login", { error: "invalid_credentials", next });

  // Defense in depth: even if "Confirm email" were turned off in Supabase, unverified users don't get in.
  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    back("/login", { error: "email_not_verified", next });
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = field(formData, "email");
  const password = formData.get("password");
  if (!email || typeof password !== "string" || password.length < MIN_PASSWORD) back("/register", { error: "invalid_signup" });
  if (formData.get("terms") !== "on") back("/register", { error: "terms_required" });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password as string,
    options: {
      emailRedirectTo: `${await origin()}/auth/confirm?next=/dashboard`,
      // GDPR proof of consent (informational only, never used for authorization).
      data: { terms_accepted_at: new Date().toISOString() },
    },
  });
  if (error) back("/register", { error: authErrorCode(error, "signup_failed") });

  // With email confirmation on there is no session until the link is clicked; never let an unverified session through.
  if (data.session) await supabase.auth.signOut();
  back("/login", { message: "verify_email_sent" });
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = field(formData, "email");
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await origin()}/auth/confirm?next=/reset-password`,
    });
  }
  // Same answer whether or not the account exists (no user enumeration).
  back("/forgot-password", { message: "reset_link_sent" });
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < MIN_PASSWORD) back("/reset-password", { error: "password_too_short" });
  if (password !== confirm) back("/reset-password", { error: "password_mismatch" });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) back("/login", { error: "link_expired" });

  const { error } = await supabase.auth.updateUser({ password: password as string });
  if (error) back("/reset-password", { error: authErrorCode(error, "password_update_failed") });

  revalidatePath("/", "layout");
  back("/dashboard", { message: "password_updated" });
}
