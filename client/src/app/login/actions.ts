"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

const MIN_PASSWORD = 8;

const back = (path: string, params: Record<string, string>) =>
  redirect(`${path}?${new URLSearchParams(params)}`);

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function origin() {
  return (await headers()).get("origin") ?? process.env.SITE_URL ?? "";
}

export async function login(formData: FormData) {
  const email = field(formData, "email");
  const password = formData.get("password");
  const next = safeNext(formData.get("next"));
  if (!email || typeof password !== "string" || !password) {
    back("/login", { error: "Email y contraseña obligatorios", next });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: password as string });
  if (error) back("/login", { error: "Email o contraseña incorrectos, o email sin verificar", next });

  // Defense in depth: even if "Confirm email" were turned off in Supabase, unverified users don't get in.
  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    back("/login", { error: "Verifica tu email antes de entrar", next });
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = field(formData, "email");
  const password = formData.get("password");
  if (!email || typeof password !== "string" || password.length < MIN_PASSWORD) {
    back("/registro", { error: `Email obligatorio y contraseña de al menos ${MIN_PASSWORD} caracteres` });
  }
  if (formData.get("terms") !== "on") {
    back("/registro", { error: "Debes aceptar los términos de uso y la política de privacidad" });
  }

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
  if (error) back("/registro", { error: "No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo" });

  // With email confirmation on there is no session until the link is clicked; never let an unverified session through.
  if (data.session) await supabase.auth.signOut();
  back("/login", { message: "Te hemos enviado un email para verificar la cuenta" });
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
  back("/forgot-password", { message: "Si el email existe, recibirás un enlace para cambiar la contraseña" });
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    back("/reset-password", { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` });
  }
  if (password !== confirm) back("/reset-password", { error: "Las contraseñas no coinciden" });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) back("/login", { error: "El enlace ha caducado, solicita otro" });

  const { error } = await supabase.auth.updateUser({ password: password as string });
  if (error) back("/reset-password", { error: "No se pudo cambiar la contraseña, solicita otro enlace" });

  revalidatePath("/", "layout");
  back("/dashboard", { message: "Contraseña actualizada" });
}
