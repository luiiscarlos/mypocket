import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { setLocale, setTheme } from "@/i18n/actions";
import { getTheme } from "@/lib/preferences";
import { themes } from "@/lib/theme";

type Page = "pricing" | "faq" | undefined;

const NAV = [
  { href: "/#how-it-works", key: "howItWorks", wide: true },
  { href: "/#tickets", key: "tickets", wide: true },
  { href: "/pricing", key: "pricing", page: "pricing" },
  { href: "/faq", key: "faq", page: "faq", wide: true },
] as const;

export const eyebrow = "font-mono text-[13px] tracking-[0.06em]";

export function Logo() {
  return (
    <Link href="/" className="text-[22px] font-extrabold tracking-[-0.04em] hover:no-underline">
      mypocket<span className="text-mint">.</span>
    </Link>
  );
}

function SiteHeader({ current }: { current: Page }) {
  const t = useTranslations("nav");
  return (
    <header className="flex h-[88px] items-center justify-between border-b border-cream/20">
      <Logo />
      <nav aria-label={t("label")} className="flex items-center gap-5 text-[15px] lg:gap-9">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={"page" in item && item.page === current ? "page" : undefined}
            className={`${"wide" in item ? "hidden lg:inline" : "hidden sm:inline"} hover:underline aria-[current=page]:underline aria-[current=page]:underline-offset-[6px]`}
          >
            {t(item.key)}
          </Link>
        ))}
        <Link href="/login" className="hover:underline">
          {t("login")}
        </Link>
        <Link href="/register" className="btn inline-flex h-11 items-center bg-mint px-5 font-semibold text-on-mint hover:no-underline">
          {t("signUp")}
        </Link>
      </nav>
    </header>
  );
}

/** Green top band with the site header; every public page starts with one. */
export function GreenHero({ current, children, className = "" }: { current?: Page; children: ReactNode; className?: string }) {
  return (
    <section id="top" className={`flex flex-col bg-strip px-5 text-on-strip lg:px-20 ${className}`}>
      <SiteHeader current={current} />
      {children}
    </section>
  );
}

// ponytail: plain ES · EN switch in the footer until the design places a language selector.
function LocaleSwitcher() {
  const t = useTranslations("footer");
  const current = useLocale();
  return (
    <form action={setLocale} aria-label={t("language")} className="flex gap-3 font-mono text-xs">
      {locales.map((locale) => (
        <button
          key={locale}
          name="locale"
          value={locale}
          aria-pressed={locale === current}
          className="cursor-pointer border-0 bg-transparent p-0 uppercase text-mist hover:underline aria-pressed:text-on-strip aria-pressed:underline"
        >
          {locale}
        </button>
      ))}
    </form>
  );
}

/** Light / dark / system. The active one comes from the server so it can be marked without client JS. */
export function ThemeSwitcher({ current, className = "" }: { current: string; className?: string }) {
  const t = useTranslations("theme");
  return (
    <form action={setTheme} aria-label={t("label")} className={`flex gap-3 font-mono text-xs ${className}`}>
      {themes.map((theme) => (
        <button
          key={theme}
          name="theme"
          value={theme}
          aria-pressed={theme === current}
          className="cursor-pointer border-0 bg-transparent p-0 uppercase text-inherit opacity-70 hover:underline aria-pressed:underline aria-pressed:opacity-100"
        >
          {t(theme)}
        </button>
      ))}
    </form>
  );
}

export async function SiteFooter() {
  const [t, theme] = await Promise.all([getTranslations("footer"), getTheme()]);
  return (
    <footer className="flex min-h-24 shrink-0 flex-col justify-center gap-3 border-t border-cream/20 bg-strip band py-6 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
      <div>{t("copyright", { year: new Date().getFullYear() })}</div>
      <div className="flex flex-wrap items-center gap-8">
        <nav aria-label={t("legal")} className="flex gap-8">
          <Link href="/privacy" className="hover:underline">{t("privacy")}</Link>
          <Link href="/terms" className="hover:underline">{t("terms")}</Link>
          <Link href="/contact" className="hover:underline">{t("contact")}</Link>
        </nav>
        <ThemeSwitcher current={theme} />
        <LocaleSwitcher />
      </div>
    </footer>
  );
}

export function CtaBand({ centered = false }: { centered?: boolean }) {
  const t = useTranslations("cta");
  return (
    <section
      className={`flex grow gap-10 bg-strip band py-20 text-on-strip lg:py-28 ${
        centered ? "flex-col items-center justify-center text-center" : "flex-col lg:flex-row lg:items-center lg:justify-between"
      }`}
    >
      <h2
        className={`m-0 font-extrabold leading-[0.9] tracking-[-0.055em] ${
          centered ? "text-6xl sm:text-8xl lg:text-[128px] lg:leading-[0.88]" : "text-6xl sm:text-7xl lg:text-[96px]"
        }`}
      >
        {t("line1")}
        <br />
        {t("line2")}
      </h2>
      <Link
        href="/register"
        className="btn inline-flex h-[60px] shrink-0 items-center self-start bg-mint px-8 text-[17px] font-semibold text-on-mint hover:no-underline lg:self-auto"
      >
        {t("button")}
      </Link>
    </section>
  );
}

/** Wrapper for the public (site) pages: paper background + footer. */
export function SitePage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-paper text-ink">{children}</div>;
}
