import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

async function remember(name: string, value: string) {
  (await cookies()).set(name, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Stores theme/locale for this browser. Invalid values are ignored. */
export async function rememberPreferences(prefs: { theme?: unknown; locale?: unknown }) {
  if (isTheme(prefs.theme)) await remember(THEME_COOKIE, prefs.theme);
  if (isLocale(prefs.locale)) await remember(LOCALE_COOKIE, prefs.locale);
}

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : "system";
}
