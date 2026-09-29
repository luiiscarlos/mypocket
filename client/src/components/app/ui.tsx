// Dashboard building blocks on shadcn/ui (components/ui/*), sized and coloured per docs/PATTERNS.md and
// the "mypocket — App" design artifact.
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import { Notice, inputClass, selectClass } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty as EmptyRoot, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";

// --- buttons (PATTERNS §6): shadcn buttonVariants with the design sizes -------------------------------
// Class strings (not <Button>) so they style <button type="submit"> in server forms and <Link>s alike.

const size = "btn gap-2 font-sans text-[15px] font-semibold hover:no-underline";
export const primaryBtn = cn(buttonVariants({ size: "lg" }), size, "h-12 rounded-control px-6");
export const secondaryBtn = cn(buttonVariants({ variant: "outline", size: "lg" }), size, "h-12 rounded-control border-control bg-transparent px-6 dark:bg-transparent");
export const smallButton = cn(buttonVariants({ variant: "outline" }), size, "h-11 rounded-control border-control bg-transparent px-4 dark:bg-transparent");
export const dangerBtn = cn(buttonVariants({ variant: "destructive", size: "lg" }), size, "h-12 rounded-control border-danger bg-transparent px-6 text-danger-ink");
export const dangerLink = cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 cursor-pointer rounded-control text-danger hover:text-danger");
export const textLink = cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-[14px] font-semibold text-ink underline");

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
    <Card id={id} className="scroll-mt-24 gap-4 rounded-card bg-field py-5 ring-rule sm:py-6">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6">
        <CardTitle><h2 className="m-0 text-lg font-bold tracking-[-0.02em]">{title}</h2></CardTitle>
        {aside && <CardAction className="static">{aside}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 text-base sm:px-6">{children}</CardContent>
    </Card>
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
  return (
    <EmptyRoot className="items-start rounded-card border border-dashed border-dash p-5 text-left md:p-6">
      <EmptyDescription className="text-[15px] text-ink-muted">{children}</EmptyDescription>
    </EmptyRoot>
  );
}

/** Full empty state of a page: dashed border, zero figure, 44 px title, one sentence and the first action. */
export function EmptyState({ figure, title, text, actions }: { figure?: string; title: string; text: string; actions?: ReactNode }) {
  return (
    <EmptyRoot className="items-start gap-5 rounded-block border border-dashed border-dash p-8 text-left sm:p-16">
      <EmptyHeader className="max-w-[560px] items-start gap-4">
        {figure && <div className="font-mono text-[13px] tracking-[0.06em] text-ink-muted">{figure}</div>}
        <EmptyTitle><h2 className="m-0 text-[32px] font-bold leading-[1] tracking-[-0.045em] sm:text-[44px]">{title}</h2></EmptyTitle>
        <EmptyDescription className="text-[17px] leading-[1.55] text-ink-muted">{text}</EmptyDescription>
      </EmptyHeader>
      {actions && <EmptyContent className="max-w-none flex-row flex-wrap items-start gap-3">{actions}</EmptyContent>}
    </EmptyRoot>
  );
}

export function EmptyAction({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link href={href} className={cn(secondary ? secondaryBtn : primaryBtn, "h-[52px] text-base")}>{children}</Link>;
}

/** Loading block with the shape of the content. */
export function Skel({ className = "" }: { className?: string }) {
  return <Skeleton className={cn("rounded-control bg-skeleton", className)} />;
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
  const active = controls.some((c) => c.value);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {controls.map((c) => (
        <Label key={c.name} className="flex-col items-stretch gap-1 text-[13px] font-semibold text-ink-muted">
          {c.label}
          {"type" in c ? (
            <Input type="date" name={c.name} defaultValue={c.value} className={cn(inputClass, "h-11 px-3 font-mono text-sm md:text-sm")} />
          ) : (
            <NativeSelect name={c.name} defaultValue={c.value ?? ""} className={cn(selectClass, "w-auto [&>select]:h-11 [&>select]:text-sm")}>
              {c.options.map((o) => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
            </NativeSelect>
          )}
        </Label>
      ))}
      <button className={smallButton}>{apply}</button>
      {active && <Link href={action} className={cn(textLink, "h-11 text-sm")}>{reset}</Link>}
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
      <ProBadge />
      <h2 className="m-0 text-2xl font-bold tracking-[-0.03em]">{title}</h2>
      <p className="m-0 max-w-[560px] text-[15px] leading-[1.55] text-ink-muted">{text}</p>
      <Link href={href} className={primaryBtn}>{cta}</Link>
    </div>
  );
}

/** "Pro" pill (shadcn Badge). */
export function ProBadge({ className = "" }: { className?: string }) {
  return <Badge variant="secondary" className={cn("h-6 rounded-full bg-field px-2.5 text-xs font-semibold text-leaf", className)}>Pro</Badge>;
}
