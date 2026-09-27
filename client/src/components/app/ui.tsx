// Dashboard building blocks on the landing's visual system (tokens, 1/3 px rules, no radii).
// Provisional until the app design and docs/PATTERNS.md arrive from Claude Design.
import type { ReactNode } from "react";
import { Notice } from "@/components/forms";
import { eyebrow } from "@/components/site/chrome";

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b-[3px] border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        <div className={`${eyebrow} text-ink-muted`}>{kicker}</div>
        <h1 className="m-0 text-4xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-5xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2">
        <h2 className="m-0 text-xl font-semibold tracking-[-0.02em]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="m-0 border border-dashed border-dash px-5 py-6 text-[15px] text-ink-muted">{children}</p>;
}

/** Row of a list: label on the left, figures on the right (mono). */
export function Row({ title, meta, value, sub, children }: { title: ReactNode; meta?: ReactNode; value?: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3.5">
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <div className="truncate text-base font-semibold">{title}</div>
        {meta && <div className="text-[13px] text-ink-muted">{meta}</div>}
      </div>
      {(value || sub) && (
        <div className="flex flex-col items-end gap-0.5 font-mono">
          {value && <div className="text-base">{value}</div>}
          {sub && <div className="text-xs text-ink-muted">{sub}</div>}
        </div>
      )}
      {children}
    </li>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="m-0 flex list-none flex-col p-0">{children}</ul>;
}

/** Translated ?error= / ?message= notice. */
export function PageNotice({ error, message }: { error?: string; message?: string }) {
  if (error) return <Notice kind="error">{error}</Notice>;
  if (message) return <Notice kind="status">{message}</Notice>;
  return null;
}

/** Horizontal bar proportional to value/max (charts without a chart library). */
export function Bar({ value, max, tone = "leaf" }: { value: number; max: number; tone?: "leaf" | "sage" | "danger" }) {
  const width = max > 0 ? Math.max(1, Math.round((Math.abs(value) / max) * 100)) : 0;
  const color = { leaf: "bg-leaf", sage: "bg-sage", danger: "bg-danger" }[tone];
  return (
    <div className="h-2.5 w-full bg-band" aria-hidden="true">
      <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export const smallButton =
  "h-10 cursor-pointer border border-ink bg-transparent px-4 font-sans text-sm font-semibold text-ink hover:bg-band disabled:cursor-not-allowed disabled:opacity-50";
export const dangerLink =
  "cursor-pointer border-0 bg-transparent p-0 font-sans text-sm text-danger underline disabled:cursor-not-allowed disabled:opacity-50";
export const mono = "font-mono tabular-nums";
