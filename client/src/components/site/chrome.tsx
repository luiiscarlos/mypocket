import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { locales } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

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
      mypocket.
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
        <Link href="/register" className="btn inline-flex h-11 items-center bg-cream px-5 font-semibold text-brand hover:no-underline">
          {t("signUp")}
        </Link>
      </nav>
    </header>
  );
}

/** Green top band with the site header; every public page starts with one. */
export function GreenHero({ current, children, className = "" }: { current?: Page; children: ReactNode; className?: string }) {
  return (
    <section id="top" className={`flex flex-col bg-brand px-5 text-cream lg:px-20 ${className}`}>
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
          className="cursor-pointer border-0 bg-transparent p-0 uppercase text-mist hover:underline aria-pressed:text-cream aria-pressed:underline"
        >
          {locale}
        </button>
      ))}
    </form>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="flex min-h-24 shrink-0 flex-col justify-center gap-3 border-t border-cream/20 bg-brand band py-6 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
      <div>{t("copyright", { year: new Date().getFullYear() })}</div>
      <div className="flex flex-wrap items-center gap-8">
        <nav aria-label={t("legal")} className="flex gap-8">
          <Link href="/privacy" className="hover:underline">{t("privacy")}</Link>
          <Link href="/terms" className="hover:underline">{t("terms")}</Link>
          <Link href="/contact" className="hover:underline">{t("contact")}</Link>
        </nav>
        <LocaleSwitcher />
      </div>
    </footer>
  );
}

export function CtaBand({ centered = false }: { centered?: boolean }) {
  const t = useTranslations("cta");
  return (
    <section
      className={`flex grow gap-10 bg-brand band py-20 text-cream lg:py-28 ${
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
        className="btn inline-flex h-[60px] shrink-0 items-center self-start bg-cream px-8 text-[17px] font-semibold text-brand hover:no-underline lg:self-auto"
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
