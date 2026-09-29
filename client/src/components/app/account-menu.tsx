// Server wrappers for the header menus shared by /dashboard and /mobile: they read the session, locale,
// theme and translations and hand plain props to the shadcn DropdownMenu components in ./menus.
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageMenu, UserMenu } from "@/components/app/menus";
import { getTheme } from "@/lib/preferences";
import type { ShellMe } from "@/lib/queries";

function initials(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

export async function LanguagePill() {
  const [t, locale] = await Promise.all([getTranslations("app"), getLocale()]);
  return (
    <LanguageMenu
      locale={locale as "es" | "en"}
      label={t("header.language")}
      names={{ es: t("settings.preferences.locales.es"), en: t("settings.preferences.locales.en") }}
    />
  );
}

/** Avatar + account menu. `base` keeps the links in their app; `withLanguage` adds the language list. */
export async function AccountMenu({ me, base, withLanguage = false, size = 38 }: { me: ShellMe; base: string; withLanguage?: boolean; size?: number }) {
  const [t, theme, locale] = await Promise.all([getTranslations("app"), getTheme(), getLocale()]);
  const name = me.readOnly ? t("demo.user") : (me.displayName ?? me.fullName ?? me.email ?? "");
  return (
    <UserMenu
      base={base}
      name={name}
      email={me.readOnly ? t("demo.readOnly") : (me.email ?? "")}
      plan={me.readOnly ? "Demo" : t(`plans.${me.plan}`)}
      initials={me.readOnly ? "D" : initials(name)}
      isAdmin={me.isAdmin}
      theme={theme}
      locale={locale as "es" | "en"}
      size={size}
      withLanguage={withLanguage}
      labels={{
        account: t("header.account"),
        profile: t("header.profile"),
        settings: t("nav.settings"),
        updates: t("nav.updates"),
        support: t("header.support"),
        tickets: t("header.tickets"),
        appearance: t("header.appearance"),
        language: t("header.language"),
        logout: t("nav.logout"),
        themes: { light: t("header.themes.light"), dark: t("header.themes.dark"), system: t("header.themes.system") },
        locales: { es: t("settings.preferences.locales.es"), en: t("settings.preferences.locales.en") },
      }}
    />
  );
}
