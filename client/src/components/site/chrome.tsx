import Link from "next/link";
import type { ReactNode } from "react";

type Page = "precios" | undefined;

const NAV = [
  { href: "/#balance", label: "Cómo funciona" },
  { href: "/#funciones", label: "Funciones" },
  { href: "/#tickets", label: "Tickets" },
];

export const eyebrow = "font-mono text-[13px] tracking-[0.06em]";

export function Logo() {
  return (
    <Link href="/" className="text-[22px] font-extrabold tracking-[-0.04em] hover:no-underline">
      mypocket.
    </Link>
  );
}

function SiteHeader({ current }: { current: Page }) {
  return (
    <header className="flex h-[88px] items-center justify-between border-b border-cream/20">
      <Logo />
      <nav aria-label="Principal" className="flex items-center gap-5 text-[15px] lg:gap-9">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="hidden hover:underline lg:inline">
            {item.label}
          </Link>
        ))}
        <Link
          href="/precios"
          aria-current={current === "precios" ? "page" : undefined}
          className="hidden hover:underline aria-[current=page]:underline aria-[current=page]:underline-offset-[6px] sm:inline"
        >
          Precios
        </Link>
        <Link href="/login" className="hover:underline">
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="inline-flex h-11 items-center bg-cream px-5 font-semibold text-brand hover:no-underline"
        >
          Empezar gratis
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

export function SiteFooter() {
  return (
    <footer className="flex min-h-24 shrink-0 flex-col justify-center gap-3 border-t border-cream/20 bg-brand px-5 py-6 text-sm text-mist sm:flex-row sm:items-center sm:justify-between lg:px-20">
      <div>© {new Date().getFullYear()} mypocket</div>
      <nav aria-label="Legal" className="flex gap-8">
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
        <Link href="/terminos" className="hover:underline">Términos</Link>
        <Link href="/contacto" className="hover:underline">Contacto</Link>
      </nav>
    </footer>
  );
}

export function CtaBand({ centered = false }: { centered?: boolean }) {
  return (
    <section
      className={`flex grow gap-10 bg-brand px-5 py-20 text-cream lg:px-20 lg:py-28 ${
        centered ? "flex-col items-center justify-center text-center" : "flex-col lg:flex-row lg:items-center lg:justify-between"
      }`}
    >
      <h2
        className={`m-0 font-extrabold leading-[0.9] tracking-[-0.055em] ${
          centered ? "text-6xl sm:text-8xl lg:text-[128px] lg:leading-[0.88]" : "text-6xl sm:text-7xl lg:text-[96px]"
        }`}
      >
        Todo tu dinero.
        <br />
        Un solo sitio.
      </h2>
      <Link
        href="/registro"
        className="inline-flex h-[60px] shrink-0 items-center self-start bg-cream px-8 text-[17px] font-semibold text-brand hover:no-underline lg:self-auto"
      >
        Crear cuenta gratis
      </Link>
    </section>
  );
}

/** Wrapper for the public (site) pages: paper background + footer. */
export function SitePage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-paper text-ink">{children}</div>;
}
