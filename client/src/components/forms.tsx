// Form primitives shared by the site, the dashboard and the mobile app, built on shadcn/ui
// (components/ui/*) with the sizes of docs/PATTERNS.md. Safe to import from client components.
import Link from "next/link";
import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "cn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
export { Textarea } from "@/components/ui/textarea";

/** Size/surface overrides for shadcn `<Input>`: 48 px, radius 12, `field` surface, 16 px text (no iOS zoom). */
export const inputClass = "h-12 rounded-control bg-field px-4 text-base md:text-base dark:bg-field";
/** For shadcn `<NativeSelect>` (the wrapper): full width, same size as inputs. */
export const selectClass =
  "w-full [&>select]:h-12 [&>select]:rounded-control [&>select]:bg-field [&>select]:pl-4 [&>select]:text-base dark:[&>select]:bg-field";
/** For shadcn `<Textarea>`. */
export const textareaClass = "min-h-32 rounded-control bg-field px-4 py-3 text-base md:text-base dark:bg-field";
/** For shadcn `<Label>` wrapping its control: text above, control below. */
export const labelClass = "flex-col items-stretch gap-2 text-sm leading-normal font-semibold";

/** Main form button (auth pages, contact): shadcn button, 56 px. */
export const primaryButton = cn(buttonVariants({ size: "lg" }), "btn h-14 w-full rounded-[14px] px-8 text-base font-semibold");

/** Result/errors of a form: shadcn `<Alert>` in the ok / error colours. */
export function Notice({ kind, children }: { kind: "error" | "status"; children: ReactNode }) {
  const error = kind === "error";
  return (
    <Alert
      role={error ? "alert" : "status"}
      variant={error ? "destructive" : "default"}
      className={cn(
        "rounded-[14px] px-4 py-3.5 text-[15px]",
        error ? "border-danger bg-danger-bg text-danger-ink *:data-[slot=alert-description]:text-danger-ink" : "border-leaf bg-ok-bg text-ink",
      )}
    >
      {error ? <CircleAlert aria-hidden /> : <CircleCheck aria-hidden className="text-leaf" />}
      <AlertDescription className="text-[15px] text-inherit">{children}</AlertDescription>
    </Alert>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 font-semibold text-ink underline")}>
      {children}
    </Link>
  );
}
