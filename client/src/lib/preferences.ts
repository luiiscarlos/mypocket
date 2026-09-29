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

const SIDEBAR_COOKIE = "sidebar";

/** Dashboard sidebar folded to icons. Read on the server so the width never jumps. */
export async function getSidebarCollapsed() {
  return (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";
}

export async function setSidebarCollapsed(collapsed: boolean) {
  await remember(SIDEBAR_COOKIE, collapsed ? "collapsed" : "expanded");
}

/** "desktop" | "mobile": the user's explicit choice of app; without it the proxy picks by device. */
export const VIEW_COOKIE = "view";

export async function setViewPreference(view: "desktop" | "mobile") {
  await remember(VIEW_COOKIE, view);
}
