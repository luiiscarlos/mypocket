"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, gql } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PAGE = "/dashboard/profile";
const back = (params: Record<string, string>) => redirect(`${PAGE}?${new URLSearchParams(params)}`);
const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

async function assertWritable() {
  const { me } = await gql<{ me: { readOnly: boolean } }>("{ me { readOnly } }");
  if (me.readOnly) back({ error: "La cuenta demo es de solo lectura" });
}

export async function updateProfile(formData: FormData) {
  await requireUser();
  const displayName = text(formData, "displayName").trim();
  const currency = text(formData, "currency").trim().toUpperCase();
  try {
    await gql(`mutation($i: UpdateProfileInput!) { updateProfile(input: $i) { id } }`, {
      i: { displayName: displayName || null, currency },
    });
  } catch (e) {
    if (e instanceof ApiError) back({ error: e.fields?.map((f) => `${f.path}: ${f.message}`).join(", ") || e.message });
    throw e;
  }
  revalidatePath(PAGE);
  back({ message: "Perfil guardado" });
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  await assertWritable();
  const current = text(formData, "current");
  const password = text(formData, "password");
  if (password.length < 8) back({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
  if (password !== text(formData, "confirm")) back({ error: "Las contraseñas no coinciden" });

  const supabase = await createClient();
  // Re-checking the current password also makes the session "recent", which Supabase's
  // "Secure password change" requires before updateUser({ password }).
  const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: current });
  if (authError) back({ error: "La contraseña actual no es correcta" });

  const { error } = await supabase.auth.updateUser({ password });
  if (error) back({ error: "No se pudo cambiar la contraseña" });
  back({ message: "Contraseña actualizada" });
}

export async function deleteAccount(formData: FormData) {
  await requireUser();
  await assertWritable();
  if (text(formData, "confirm") !== "BORRAR") back({ error: 'Escribe BORRAR para confirmar' });

  await gql<{ deleteMyAccount: boolean }>("mutation { deleteMyAccount }");
  // The API already revoked every session; this clears the local cookies.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/login?message=" + encodeURIComponent("Tu cuenta y todos tus datos se han borrado"));
}
