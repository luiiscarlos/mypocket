"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Add/edit dialog on shadcn `Dialog` (Base UI: focus trap, Esc, focus return, scroll lock).
 * Desktop: centred, radius 28, up to 640 px. Phones: a bottom sheet (full width, anchored to the bottom,
 * rounded top only, safe-area padding). The form inside is a normal server-action form: the dialog closes
 * as soon as it submits and the page shows the result notice after the redirect.
 */
export function Modal({
  title, trigger, triggerClassName, triggerLabel, closeLabel, defaultOpen = false, children,
}: {
  title: string; trigger: ReactNode; triggerClassName: string; triggerLabel?: string; closeLabel: string; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName} aria-label={triggerLabel} title={triggerLabel}>
        {trigger}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        // Close after the submit event has been handed to the form's action.
        onSubmit={() => setTimeout(() => setOpen(false), 0)}
        className="max-h-[calc(100dvh-32px)] gap-6 overflow-y-auto rounded-[28px] bg-field p-6 text-base text-ink shadow-float ring-rule sm:max-w-[640px] sm:p-8 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[90dvh] max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none max-sm:p-5 max-sm:pb-[max(20px,env(safe-area-inset-bottom))] max-sm:data-open:slide-in-from-bottom max-sm:data-open:zoom-in-100 max-sm:data-closed:slide-out-to-bottom max-sm:data-closed:zoom-out-100"
      >
        <span aria-hidden="true" className="mx-auto -mt-1 block h-1 w-10 rounded-full bg-rule sm:hidden" />
        <DialogHeader className="flex-row items-start justify-between gap-4">
          <DialogTitle className="m-0 text-2xl font-bold tracking-[-0.03em]">{title}</DialogTitle>
          <DialogClose aria-label={closeLabel} className={buttonVariants({ variant: "ghost", size: "icon", className: "-m-2 size-11 rounded-full" })}>
            <X size={20} aria-hidden />
          </DialogClose>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
