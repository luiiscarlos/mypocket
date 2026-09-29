// Header menus shared by the desktop (/dashboard) and mobile (/mobile) apps: language pill with flags and
// the avatar menu (profile, settings, updates, support, admin tickets, appearance, log out).
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Check, ChevronDown, Languages, LifeBuoy, LogOut, Megaphone, Monitor, Moon, Settings, ShieldCheck, Sun, UserRound } from "lucide-react";
import { FLAGS } from "@/components/app/flags";
import { setLocale, setTheme } from "@/i18n/actions";
import { locales } from "@/i18n/config";
import { logout } from "@/lib/auth-actions";
import { getTheme } from "@/lib/preferences";
import type { ShellMe } from "@/lib/queries";

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const menuItem = "flex h-11 w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 bg-transparent px-3 font-sans text-[15px] text-ink hover:bg-band hover:no-underline";
const summaryReset = "list-none [&::-webkit-details-marker]:hidden";
const dropdown = "absolute right-0 top-12 z-30 flex max-w-[calc(100vw-16px)] flex-col border border-rule bg-field shadow-float";

function initials(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

export async function LanguagePill() {
  const [t, locale] = await Promise.all([getTranslations("app"), getLocale()]);
  const Flag = FLAGS[locale as keyof typeof FLAGS] ?? FLAGS.es;
  return (
    <details className="relative">
      <summary className={`${summaryReset} flex h-10 cursor-pointer items-center gap-2 rounded-full border border-rule bg-field px-3 text-sm font-semibold uppercase hover:border-control`} aria-label={t("header.language")}>
        <Flag className="h-3.5 w-5 rounded-[3px]" />
        {locale}
        <ChevronDown size={14} aria-hidden />
      </summary>
      <LanguageList className={`${dropdown} w-[200px] rounded-2xl p-1.5`} />
    </details>
  );
}

async function LanguageList({ className }: { className: string }) {
  const [t, locale] = await Promise.all([getTranslations("app"), getLocale()]);
  return (
    <form action={setLocale} className={className}>
      {locales.map((l) => {
        const F = FLAGS[l];
        return (
          <button key={l} name="locale" value={l} aria-pressed={l === locale} className={`${menuItem} aria-pressed:font-semibold`}>
            <F className="h-3.5 w-5 rounded-[3px]" />
            <span className="grow text-left">{t(`settings.preferences.locales.${l}`)}</span>
            {l === locale && <Check size={16} className="text-leaf" aria-hidden />}
          </button>
        );
      })}
    </form>
  );
}

/**
 * Avatar + account menu. `base` is the app the links stay in (/dashboard or /mobile); `withLanguage` adds
 * the language list inside the menu for headers too narrow for the separate pill.
 */
export async function AccountMenu({ me, base, withLanguage = false, size = 38 }: { me: ShellMe; base: string; withLanguage?: boolean; size?: number }) {
  const [t, theme] = await Promise.all([getTranslations("app"), getTheme()]);
  const name = me.readOnly ? t("demo.user") : (me.displayName ?? me.fullName ?? me.email ?? "");
  const planLabel = me.readOnly ? "Demo" : t(`plans.${me.plan}`);
  return (
    <details className="relative">
      <summary
        className={`${summaryReset} flex cursor-pointer items-center justify-center rounded-full bg-leaf text-[13px] font-bold text-on-leaf`}
        style={{ width: size, height: size }}
        aria-label={t("header.account")}
        title={name}
      >
        {me.readOnly ? "D" : initials(name)}
      </summary>
      <div className={`${dropdown} w-[272px] rounded-[18px] p-2`}>
        <div className="flex flex-col gap-0.5 border-b border-rule px-3 pb-3 pt-2">
          <span className="truncate text-[15px] font-semibold">{name}</span>
          <span className="truncate text-[13px] text-ink-muted">{me.readOnly ? t("demo.readOnly") : me.email}</span>
          <span className="mt-2 self-start rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-semibold text-leaf">{planLabel}</span>
        </div>
        <nav aria-label={t("header.account")} className="flex flex-col py-1.5">
          <Link href={`${base}/settings?tab=profile`} className={menuItem}><UserRound size={18} aria-hidden />{t("header.profile")}</Link>
          <Link href={`${base}/settings`} className={menuItem}><Settings size={18} aria-hidden />{t("nav.settings")}</Link>
          <Link href={`${base}/updates`} className={menuItem}><Megaphone size={18} aria-hidden />{t("nav.updates")}</Link>
          <Link href={`${base}/support`} className={menuItem}><LifeBuoy size={18} aria-hidden />{t("header.support")}</Link>
          {me.isAdmin && (
            <Link href={`${base}/support/admin`} className={menuItem}>
              <ShieldCheck size={18} aria-hidden />
              <span className="grow">{t("header.tickets")}</span>
              <span className="rounded-full bg-info-bg px-2 py-0.5 text-[11px] font-semibold text-info-ink">Admin</span>
            </Link>
          )}
        </nav>
        {withLanguage && (
          <div className="border-t border-rule py-1.5">
            <span className="flex items-center gap-2 px-3 pb-1 pt-1.5 text-[13px] font-semibold text-ink-muted"><Languages size={16} aria-hidden />{t("header.language")}</span>
            <LanguageList className="flex flex-col" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-rule px-3 py-3">
          <span className="text-[15px]">{t("header.appearance")}</span>
          <form action={setTheme} className="inline-flex gap-0.5 rounded-full border border-rule p-[3px]">
            {(["light", "dark", "system"] as const).map((th) => {
              const Icon = THEME_ICONS[th];
              return (
                <button key={th} name="theme" value={th} aria-pressed={th === theme} aria-label={t(`header.themes.${th}`)} title={t(`header.themes.${th}`)} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink-muted aria-pressed:bg-band aria-pressed:text-ink">
                  <Icon size={15} aria-hidden />
                </button>
              );
            })}
          </form>
        </div>
        <form action={logout} className="border-t border-rule pt-1.5">
          <button className={`${menuItem} text-ink-muted`}><LogOut size={18} aria-hidden />{t("nav.logout")}</button>
        </form>
      </div>
    </details>
  );
}
