"use server";

import { revalidatePath } from "next/cache";
import { ApiError, gql } from "@/lib/api";
import { rememberPreferences } from "@/lib/preferences";
import { createClient } from "@/lib/supabase/server";
import { isTheme } from "@/lib/theme";
import { isLocale } from "./config";

/** Signed-in users also get the preference stored in their profile, so it follows them to other devices. */
async function saveToProfile(input: { theme?: string; locale?: string }) {
  const { data } = await (await createClient()).auth.getClaims();
  if (!data?.claims) return;
  try {
    await gql(`mutation ($input: UpdateProfileInput!) { updateProfile(input: $input) { id } }`, { input });
  } catch (e) {
    // The demo account is read-only: the cookie still applies for this browser.
    if (!(e instanceof ApiError)) throw e;
  }
}

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  await rememberPreferences({ locale });
  await saveToProfile({ locale: locale.toUpperCase() });
  revalidatePath("/", "layout");
}

export async function setTheme(formData: FormData) {
  const theme = formData.get("theme");
  if (!isTheme(theme)) return;
  await rememberPreferences({ theme });
  await saveToProfile({ theme: theme.toUpperCase() });
  revalidatePath("/", "layout");
}
