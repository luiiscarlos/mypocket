// Dashboard building blocks following docs/PATTERNS.md and the "mypocket — App" design artifact.
import Link from "next/link";
import type { ReactNode } from "react";
import { Notice } from "@/components/forms";

// --- buttons (PATTERNS §6) ----------------------------------------------------------------------

const base = "btn inline-flex cursor-pointer items-center rounded-control justify-center gap-2 font-sans text-[15px] font-semibold hover:no-underline disabled:cursor-not-allowed";
export const primaryBtn = `${base} h-12 border-0 bg-leaf px-6 text-on-leaf disabled:bg-rule disabled:text-ink-muted`;
export const secondaryBtn = `${base} h-12 border border-ink bg-transparent px-6 text-ink disabled:opacity-50`;
export const smallButton = `${base} h-11 border border-ink bg-transparent px-4 text-ink disabled:opacity-50`;
export const dangerBtn = `${base} h-12 border border-danger bg-transparent px-6 text-danger-ink`;
export const dangerLink = "min-h-11 cursor-pointer border-0 bg-transparent px-1 font-sans text-sm text-danger underline";
export const textLink = "text-[14px] font-semibold text-ink underline";

// --- layout ---------------------------------------------------------------------------------------

/**
 * Page toolbar. The page title itself is the h1 in the top bar (design v3), so this only shows the
 * page's meta line and actions; `title` stays for callers that need it elsewhere.
 */
export function PageHeader({ meta, children }: { title?: string; meta?: string; children?: ReactNode }) {
  if (!meta && !children) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {meta ? <span className="text-sm text-ink-muted">{meta}</span> : <span />}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Block card: title row (with an optional aside) over the content. Radius 20, 1 px border. */
export function Section({ id, title, aside, children }: { id?: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-rule bg-field p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-bold tracking-[-0.02em]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="m-0 flex list-none flex-col p-0">{children}</ul>;
}

/** List row: name and meta on the left, mono figures on the right, actions last. */
export function Row({ title, meta, value, sub, children }: { title: ReactNode; meta?: ReactNode; value?: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3 last:border-b-0">
      <div className="flex min-w-0 grow basis-48 flex-col gap-[3px]">
        <div className="text-base font-semibold">{title}</div>
        {meta && <div className="text-[13px] text-ink-muted">{meta}</div>}
      </div>
      {(value || sub) && (
        <div className="flex flex-col items-end gap-0.5 font-mono tabular-nums">
          {value && <div className="text-base">{value}</div>}
          {sub && <div className="text-xs text-ink-muted">{sub}</div>}
        </div>
      )}
      {children}
    </li>
  );
}

// --- states (PATTERNS §7) ---------------------------------------------------------------------------

/** Small inline empty state inside a block (a list with nothing yet). */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="m-0 rounded-card border border-dashed border-dash px-5 py-6 text-[15px] text-ink-muted">{children}</p>;
}

/** Full empty state of a page: dashed border, zero figure, 44 px title, one sentence and the first action. */
export function EmptyState({ figure, title, text, actions }: { figure?: string; title: string; text: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-block border border-dashed border-dash p-8 sm:p-16">
      {figure && <div className="font-mono text-[13px] tracking-[0.06em] text-ink-muted">{figure}</div>}
      <h2 className="m-0 text-[32px] font-bold leading-[1] tracking-[-0.045em] sm:text-[44px]">{title}</h2>
      <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] text-ink-muted">{text}</p>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyAction({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link href={href} className={`${secondary ? secondaryBtn : primaryBtn} h-[52px] text-base`}>{children}</Link>;
}

/** Loading block with the shape of the content. */
export function Skel({ className = "" }: { className?: string }) {
  return <div className={`rounded-control bg-skeleton ${className}`} />;
}

/** Container for a loading view: announced once, blocks hidden from assistive tech. */
export function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-label={label} role="status" className="flex flex-col gap-8">
      <div aria-hidden="true" className="contents">{children}</div>
    </div>
  );
}

export function SkelRows({ count = 3, height = "h-14" }: { count?: number; height?: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Skel className="h-[22px] w-[30%]" />
      <Skel className="h-[3px]" />
      {Array.from({ length: count }, (_, i) => <Skel key={i} className={`${height} w-full`} />)}
    </div>
  );
}

/** Translated ?error= / ?message= notice. */
export function PageNotice({ error, message }: { error?: string; message?: string }) {
  if (error) return <Notice kind="error">{error}</Notice>;
  if (message) return <Notice kind="status">{message}</Notice>;
  return null;
}

// --- charts ---------------------------------------------------------------------------------------

/** Horizontal bar proportional to value/max (charts without a chart library). */
export function Bar({ value, max, tone = "s1" }: { value: number; max: number; tone?: "s1" | "s2" | "s3" | "debt" }) {
  const width = max > 0 ? Math.max(1, Math.round((Math.abs(value) / max) * 100)) : 0;
  const color = { s1: "bg-s1", s2: "bg-s2", s3: "bg-s3", debt: "bg-debt" }[tone];
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-band" aria-hidden="true">
      <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export const mono = "font-mono tabular-nums";

// --- list filters -----------------------------------------------------------------------------------

export type Control = { name: string; label: string; value?: string; options: { value: string; label: string }[] } | { name: string; label: string; value?: string; type: "date" };

/**
 * Filter and sort bar for a list: a plain GET form, so it works without JS and the URL can be shared.
 * `keep` carries other query params of the page (e.g. an open search).
 */
export function ListControls({ action, controls, keep = {}, apply, reset }: { action: string; controls: Control[]; keep?: Record<string, string>; apply: string; reset: string }) {
  const field = "h-11 rounded-control border border-control bg-field px-3 font-sans text-sm text-ink";
  const active = controls.some((c) => c.value);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {controls.map((c) => (
        <label key={c.name} className="flex flex-col gap-1 font-mono text-[11px] tracking-[0.06em] text-ink-muted">
          {c.label}
          {"type" in c ? (
            <input type="date" name={c.name} defaultValue={c.value} className={`${field} font-mono`} />
          ) : (
            <select name={c.name} defaultValue={c.value ?? ""} className={field}>
              {c.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </label>
      ))}
      <button className={smallButton}>{apply}</button>
      {active && <Link href={action} className="flex h-11 items-center text-sm underline">{reset}</Link>}
    </form>
  );
}

/** Value of a query param when it is one of the allowed ones. */
export function pick<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Pro feature seen from the Free plan: what it does and the way to upgrade (Settings → Plan). */
export function ProUpsell({ title, text, cta, href = "/dashboard/settings?tab=plan" }: { title: string; text: string; cta: string; href?: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-block border border-leaf bg-ok-bg p-6 sm:p-8">
      <span className="rounded-full bg-field px-2.5 py-0.5 text-xs font-semibold text-leaf">Pro</span>
      <h2 className="m-0 text-2xl font-bold tracking-[-0.03em]">{title}</h2>
      <p className="m-0 max-w-[560px] text-[15px] leading-[1.55] text-ink-muted">{text}</p>
      <Link href={href} className={primaryBtn}>{cta}</Link>
    </div>
  );
}
