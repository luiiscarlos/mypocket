// Public site chrome, design v3 (Claude Design "LHeader" / "LFooter"): sticky translucent header,
// white + beige surfaces, soft radii and the brand green as accent.
import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronDown, Menu as MenuIcon, Monitor, Moon, Sun } from "lucide-react";
import { FLAGS } from "@/components/app/flags";
import { locales } from "@/i18n/config";
import { setLocale, setTheme } from "@/i18n/actions";
import { getTheme } from "@/lib/preferences";

type Page = "pricing" | "faq" | "contact" | undefined;

const NAV = [
  { href: "/#how-it-works", key: "howItWorks" },
  { href: "/#features", key: "features" },
  { href: "/pricing", key: "pricing", page: "pricing" },
  { href: "/faq", key: "faq", page: "faq" },
] as const;

export const eyebrow = "text-sm font-semibold text-leaf";
const pill = "flex h-10 cursor-pointer items-center gap-2 rounded-full border border-rule bg-transparent px-3 font-sans text-sm text-ink hover:border-control";
const summaryReset = "list-none [&::-webkit-details-marker]:hidden";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`text-[21px] font-bold tracking-[-0.03em] text-ink hover:no-underline ${className}`}>
      mypocket<span className="text-leaf">.</span>
    </Link>
  );
}

/** Language pill with flags (dropdown). */
export async function LanguagePill({ up = false }: { up?: boolean }) {
  const [t, locale] = await Promise.all([getTranslations("footer"), getLocale()]);
  const Flag = FLAGS[locale as keyof typeof FLAGS] ?? FLAGS.es;
  return (
    <details className="relative">
      <summary className={`${summaryReset} ${pill}`} aria-label={t("language")}>
        <Flag className="h-3.5 w-5 rounded-[3px]" />
        <span className="uppercase">{locale}</span>
        <ChevronDown size={14} aria-hidden />
      </summary>
      <form action={setLocale} className={`absolute right-0 z-30 flex w-44 flex-col rounded-2xl border border-rule bg-field p-1.5 shadow-float ${up ? "bottom-12" : "top-12"}`}>
        {locales.map((l) => {
          const F = FLAGS[l];
          return (
            <button key={l} name="locale" value={l} aria-pressed={l === locale} className="flex h-10 cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 font-sans text-sm text-ink hover:bg-band aria-pressed:font-semibold">
              <F className="h-3.5 w-5 rounded-[3px]" />
              {t(`languages.${l}`)}
            </button>
          );
        })}
      </form>
    </details>
  );
}

async function SiteHeader({ current }: { current: Page }) {
  const [t, theme] = await Promise.all([getTranslations("nav"), getTheme()]);
  // One round button toggles light/dark; "system" lives in the footer selector.
  const next = theme === "dark" ? "light" : "dark";
  return (
    <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-rule bg-header px-5 backdrop-blur-md lg:px-16">
      <Logo />
      <nav aria-label={t("label")} className="hidden items-center gap-1 text-[15px] lg:flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={"page" in item && item.page === current ? "page" : undefined}
            className="rounded-[10px] px-3.5 py-2.5 text-ink-muted hover:bg-band hover:text-ink hover:no-underline aria-[current=page]:bg-band aria-[current=page]:font-semibold aria-[current=page]:text-ink"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <div className="hidden sm:block"><LanguagePill /></div>
        <form action={setTheme} className="hidden sm:block">
          <button name="theme" value={next} aria-label={t(next === "dark" ? "toDark" : "toLight")} title={t(next === "dark" ? "toDark" : "toLight")} className={`${pill} w-10 justify-center px-0`}>
            {next === "dark" ? <Moon size={17} aria-hidden /> : <Sun size={17} aria-hidden />}
          </button>
        </form>
        <Link href="/login" className="hidden rounded-[10px] px-3.5 py-2.5 text-[15px] font-medium text-ink hover:bg-band hover:no-underline sm:inline-flex">{t("login")}</Link>
        <Link href="/register" className="btn inline-flex h-[42px] items-center rounded-control bg-leaf px-4 text-[15px] font-semibold text-on-leaf hover:no-underline sm:px-[18px]">
          {t("signUp")}
        </Link>
        {/* Below lg: the navigation, language, theme and log in move into a menu (<details>, no JS). */}
        <details className="relative lg:hidden">
          <summary className={`${summaryReset} ${pill} w-10 justify-center px-0`} aria-label={t("menu")}>
            <MenuIcon size={18} aria-hidden />
          </summary>
          <div className="absolute right-0 top-12 z-30 flex w-[min(280px,calc(100vw-24px))] flex-col gap-1 rounded-2xl border border-rule bg-field p-2 shadow-float">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={"page" in item && item.page === current ? "page" : undefined}
                className="flex h-11 items-center rounded-[10px] px-3 text-[15px] text-ink hover:bg-band hover:no-underline aria-[current=page]:bg-band aria-[current=page]:font-semibold"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link href="/login" className="flex h-11 items-center rounded-[10px] px-3 text-[15px] font-semibold text-ink hover:bg-band hover:no-underline sm:hidden">{t("login")}</Link>
            <div className="mt-1 flex items-center justify-between gap-2 border-t border-rule px-1 pt-3 sm:hidden">
              <LanguagePill />
              <ThemeSwitcher />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

/** Top of every public page: sticky header + the page's intro block. */
export function PageHero({ current, children, className = "" }: { current?: Page; children: ReactNode; className?: string }) {
  return (
    <>
      <SiteHeader current={current} />
      <section id="top" className={`flex flex-col band ${className}`}>{children}</section>
    </>
  );
}

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

/** Light / dark / system icons in a pill. The active one comes from the server (no client JS). */
export async function ThemeSwitcher({ className = "" }: { className?: string }) {
  const [t, current] = await Promise.all([getTranslations("theme"), getTheme()]);
  return (
    <form action={setTheme} aria-label={t("label")} className={`inline-flex gap-0.5 rounded-full border border-rule p-[3px] ${className}`}>
      {(["light", "dark", "system"] as const).map((theme) => {
        const Icon = THEME_ICONS[theme];
        return (
          <button
            key={theme}
            name="theme"
            value={theme}
            aria-pressed={theme === current}
            aria-label={t(theme)}
            title={t(theme)}
            className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink-muted aria-pressed:bg-band aria-pressed:text-ink"
          >
            <Icon size={14} aria-hidden />
          </button>
        );
      })}
    </form>
  );
}

export async function SiteFooter() {
  const [t, nav] = await Promise.all([getTranslations("footer"), getTranslations("nav")]);
  const columns = [
    { title: t("product"), links: [["/#features", nav("features")], ["/pricing", nav("pricing")], ["/login", nav("login")]] },
    { title: t("help"), links: [["/faq", nav("faq")], ["/contact", t("contact")]] },
    { title: t("legal"), links: [["/privacy", t("privacy")], ["/terms", t("terms")]] },
  ];
  return (
    <footer className="flex shrink-0 flex-col gap-12 border-t border-rule bg-paper band pb-10 pt-16 text-ink">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <Logo />
          <span className="max-w-[280px] text-sm leading-[1.55] text-ink-muted">{t("tagline")}</span>
        </div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-2.5 text-sm">
            <span className="font-semibold">{c.title}</span>
            {c.links.map(([href, label]) => (
              <Link key={href} href={href} className="text-ink-muted hover:text-ink">{label}</Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="flex flex-col-reverse items-start justify-between gap-4 border-t border-rule pt-6 text-[13px] text-ink-muted sm:flex-row sm:items-center">
        <span>{t("copyright", { year: new Date().getFullYear() })}</span>
        <span className="flex items-center gap-2">
          <LanguagePill up />
          <ThemeSwitcher />
        </span>
      </div>
    </footer>
  );
}

/** Brand-green closing block with the sign-up call to action. */
export async function CtaBand() {
  const t = await getTranslations("cta");
  return (
    <section className="band py-20 lg:py-28">
      <div className="flex flex-col gap-10 rounded-block bg-strip p-10 text-on-strip lg:flex-row lg:items-center lg:justify-between lg:p-[72px]">
        <h2 className="m-0 text-5xl font-bold leading-[1.02] tracking-[-0.045em] lg:text-[56px]">
          {t("line1")}
          <br />
          {t("line2")}
        </h2>
        <Link href="/register" className="btn inline-flex h-14 shrink-0 items-center self-start rounded-[14px] bg-cta-btn px-7 text-base font-semibold text-on-cta-btn hover:no-underline lg:self-auto">
          {t("button")}
        </Link>
      </div>
    </section>
  );
}

/** Wrapper for the public (site) pages. */
export function SitePage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-paper text-ink">{children}</div>;
}
