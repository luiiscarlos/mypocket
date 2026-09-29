"use client";

// Header menus on shadcn DropdownMenu (Base UI Menu: keyboard navigation, Esc, outside click, focus
// return). Server actions are called directly from the menu items.
import Link from "next/link";
import { useTransition, type ReactNode } from "react";
import { ChevronDown, Languages, LifeBuoy, LogOut, Megaphone, Menu as MenuIcon, Monitor, Moon, Settings, ShieldCheck, Sun, UserRound } from "lucide-react";
import { FLAGS } from "@/components/app/flags";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale, setTheme } from "@/i18n/actions";
import { logout } from "@/lib/auth-actions";

type Locale = "es" | "en";
type Theme = "light" | "dark" | "system";

const item = "h-10 cursor-pointer gap-3 rounded-[10px] px-3 text-[15px] text-ink";
const content = "rounded-[18px] border border-rule bg-field p-2 text-ink shadow-float ring-0";
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

const form = (key: string, value: string) => {
  const fd = new FormData();
  fd.set(key, value);
  return fd;
};

function LanguageItems({ locale, names }: { locale: Locale; names: Record<Locale, string> }) {
  const [, start] = useTransition();
  return (
    <DropdownMenuRadioGroup value={locale} onValueChange={(v) => start(() => setLocale(form("locale", String(v))))}>
      {(Object.keys(names) as Locale[]).map((l) => {
        const F = FLAGS[l];
        return (
          <DropdownMenuRadioItem key={l} value={l} className={`${item} pr-9`}>
            <F className="h-3.5 w-5 rounded-[3px]" />
            {names[l]}
          </DropdownMenuRadioItem>
        );
      })}
    </DropdownMenuRadioGroup>
  );
}

/** Language pill with flag + code; the list shows both languages with their flags. */
export function LanguageMenu({ locale, label, names, className = "" }: { locale: Locale; label: string; names: Record<Locale, string>; className?: string }) {
  const Flag = FLAGS[locale];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className={`flex h-10 cursor-pointer items-center gap-2 rounded-full border border-rule bg-field px-3 font-sans text-sm font-semibold uppercase text-ink hover:border-control ${className}`}
      >
        <Flag className="h-3.5 w-5 rounded-[3px]" />
        {locale}
        <ChevronDown size={14} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={`${content} w-[200px] p-1.5`}>
        <LanguageItems locale={locale} names={names} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type UserMenuProps = {
  base: string;
  name: string;
  email: string;
  plan: string;
  initials: string;
  isAdmin: boolean;
  theme: Theme;
  locale: Locale;
  size: number;
  withLanguage: boolean;
  labels: {
    account: string; profile: string; settings: string; updates: string; support: string; tickets: string;
    appearance: string; language: string; logout: string; themes: Record<Theme, string>; locales: Record<Locale, string>;
  };
};

/** Avatar + account menu (profile, settings, updates, support, admin tickets, appearance, language, log out). */
export function UserMenu({ base, name, email, plan, initials, isAdmin, theme, locale, size, withLanguage, labels }: UserMenuProps) {
  const [, start] = useTransition();
  const link = (href: string, icon: ReactNode, text: ReactNode) => (
    <DropdownMenuItem className={item} render={<Link href={href} />}>
      {icon}
      {text}
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.account}
        title={name}
        className="flex cursor-pointer items-center justify-center rounded-full border-0 bg-leaf font-sans text-[13px] font-bold text-on-leaf"
        style={{ width: size, height: size }}
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={`${content} w-[272px] max-w-[calc(100vw-16px)]`}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 pb-3 pt-2">
            <span className="truncate text-[15px] font-semibold text-ink">{name}</span>
            <span className="truncate text-[13px] font-normal text-ink-muted">{email}</span>
            <Badge variant="secondary" className="mt-2 h-6 rounded-full bg-ok-bg px-2.5 text-xs font-semibold text-leaf">{plan}</Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuGroup>
          {link(`${base}/settings?tab=profile`, <UserRound size={18} aria-hidden />, labels.profile)}
          {link(`${base}/settings`, <Settings size={18} aria-hidden />, labels.settings)}
          {link(`${base}/updates`, <Megaphone size={18} aria-hidden />, labels.updates)}
          {link(`${base}/support`, <LifeBuoy size={18} aria-hidden />, labels.support)}
          {isAdmin && link(`${base}/support/admin`, <ShieldCheck size={18} aria-hidden />, (
            <>
              <span className="grow">{labels.tickets}</span>
              <Badge variant="secondary" className="rounded-full bg-info-bg text-[11px] font-semibold text-info-ink">Admin</Badge>
            </>
          ))}
        </DropdownMenuGroup>
        {withLanguage && (
          <>
            <DropdownMenuSeparator className="bg-rule" />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 px-3 text-[13px] font-semibold text-ink-muted"><Languages size={16} aria-hidden />{labels.language}</DropdownMenuLabel>
              <LanguageItems locale={locale} names={labels.locales} />
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 text-[13px] font-semibold text-ink-muted">{labels.appearance}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => start(() => setTheme(form("theme", String(v))))}>
            {(["light", "dark", "system"] as const).map((th) => {
              const Icon = THEME_ICONS[th];
              return (
                <DropdownMenuRadioItem key={th} value={th} className={`${item} pr-9`}>
                  <Icon size={16} aria-hidden />
                  {labels.themes[th]}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuItem className={`${item} text-ink-muted`} onClick={() => start(() => logout())}>
          <LogOut size={18} aria-hidden />
          {labels.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Landing menu below lg: navigation, log in, language and theme in one shadcn DropdownMenu. */
export function SiteMenu({
  label, links, login, locale, theme, languageLabel, themeLabel, names, themes,
}: {
  label: string; links: { href: string; label: string; current?: boolean }[]; login: string; locale: Locale; theme: Theme;
  languageLabel: string; themeLabel: string; names: Record<Locale, string>; themes: Record<Theme, string>;
}) {
  const [, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-rule bg-transparent text-ink hover:border-control lg:hidden">
        <MenuIcon size={18} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={`${content} w-[min(280px,calc(100vw-24px))]`}>
        <DropdownMenuGroup>
          {links.map((l) => (
            <DropdownMenuItem key={l.href} className={`${item} ${l.current ? "bg-band font-semibold" : ""}`} render={<Link href={l.href} aria-current={l.current ? "page" : undefined} />}>
              {l.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem className={`${item} font-semibold sm:hidden`} render={<Link href="/login" />}>{login}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 text-[13px] font-semibold text-ink-muted">{languageLabel}</DropdownMenuLabel>
          <LanguageItems locale={locale} names={names} />
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 text-[13px] font-semibold text-ink-muted">{themeLabel}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => start(() => setTheme(form("theme", String(v))))}>
            {(["light", "dark", "system"] as const).map((th) => {
              const Icon = THEME_ICONS[th];
              return (
                <DropdownMenuRadioItem key={th} value={th} className={`${item} pr-9`}>
                  <Icon size={16} aria-hidden />
                  {themes[th]}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

