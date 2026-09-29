"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

// Drag past this many px on the handle closes the sheet.
const DRAG_CLOSE_PX = 110;

/**
 * Add/edit dialog on Base UI `Dialog` (focus trap, Esc, focus return, scroll lock). Desktop: centred,
 * radius 28, up to 640 px, unchanged from the original design. Phones: a bottom sheet that never
 * navigates to open (it renders wherever the trigger — or a controlled `open` — lives), with a centred
 * title, a close/save pair that swaps sides when the form has a save button, a sticky drag handle (the
 * only draggable strip — dragging past a threshold closes it) and a top-edge shadow instead of a
 * backdrop blur. Dialogs opened from inside another one (Base UI's nested-dialog detection) shrink the
 * parent slightly and slide up over it, both directions always animated.
 */
export function Modal({
  title, trigger, triggerClassName, triggerLabel, closeLabel, defaultOpen = false, open: openProp, onOpenChange: onOpenChangeProp, children,
}: {
  title: string; trigger?: ReactNode; triggerClassName?: string; triggerLabel?: string; closeLabel: string;
  defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChangeProp ?? setUncontrolledOpen;

  // The form's own submit button (if any) becomes the mobile header's save action; we proxy clicks to
  // it instead of moving it, so every consumer's existing form keeps working untouched.
  const contentRef = useRef<HTMLDivElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    const btn = contentRef.current?.querySelector("form")?.querySelector<HTMLButtonElement>("button:not([type=button])") ?? null;
    saveBtnRef.current = btn;
    setSaveLabel(btn?.textContent?.trim() || null);
  }, [open]);

  // Drag-to-dismiss, from the sticky handle only (mobile). Below the threshold it springs back; past it,
  // we finish the slide-down ourselves and only then flip `open`, so the exit is always one smooth motion.
  const popupRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; active: boolean } | null>(null);
  const [dragClosing, setDragClosing] = useState(false);

  function settle(el: HTMLDivElement, transform: string, ms: number, after?: () => void) {
    el.style.transition = `transform ${ms}ms ease-out`;
    el.style.transform = transform;
    const done = () => { el.removeEventListener("transitionend", done); after?.(); };
    el.addEventListener("transitionend", done, { once: true });
    setTimeout(done, ms + 60);
  }

  function onHandleDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, active: true };
  }
  function onHandleMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = popupRef.current;
    if (!drag.current?.active || !el) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    el.style.transition = "none";
    el.style.transform = dy ? `translateY(${dy}px)` : "";
  }
  function onHandleUp(e: ReactPointerEvent<HTMLDivElement>) {
    const el = popupRef.current;
    if (!drag.current?.active || !el) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    drag.current.active = false;
    if (dy > DRAG_CLOSE_PX) {
      setDragClosing(true);
      settle(el, "translateY(100%)", 180, () => {
        setOpen(false);
        el.style.transition = "";
        el.style.transform = "";
        // Separate tick: `dragClosing` must still be true in the render where `open` first flips to
        // false (that's the one Base UI reads to skip its own slide-out), or the exit doubles up.
        setTimeout(() => setDragClosing(false), 0);
      });
    } else {
      settle(el, "", 180);
    }
  }

  const closeBtn = (
    <DialogPrimitive.Close aria-label={closeLabel} className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-full" })}>
      <X size={18} aria-hidden />
    </DialogPrimitive.Close>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogPrimitive.Trigger className={triggerClassName} aria-label={triggerLabel} title={triggerLabel}>
          {trigger}
        </DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/10 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 max-sm:bg-transparent max-sm:backdrop-blur-none max-sm:supports-backdrop-filter:backdrop-blur-none"
        />
        <DialogPrimitive.Popup
          ref={popupRef}
          onSubmit={() => setTimeout(() => setOpen(false), 0)}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-hidden rounded-[28px] bg-field p-6 text-base text-ink shadow-float ring-1 ring-rule outline-none sm:max-w-[640px] sm:p-8",
            "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[90dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:gap-0 max-sm:rounded-b-none max-sm:rounded-t-[20px] max-sm:p-0 max-sm:shadow-[0_-10px_28px_-8px_rgb(0_0_0_/_0.2)] max-sm:ring-0",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "max-sm:data-open:slide-in-from-bottom max-sm:data-open:zoom-in-100 max-sm:data-open:fade-in-0",
            dragClosing ? "max-sm:data-closed:duration-0" : "max-sm:data-closed:slide-out-to-bottom max-sm:data-closed:zoom-out-100 max-sm:data-closed:fade-out-0",
            "transition-[transform,opacity] duration-150 data-[nested-dialog-open]:scale-[0.96] data-[nested-dialog-open]:opacity-90",
          )}
        >
          {/* Sticky drag handle (mobile only): the only part of the sheet that drags to dismiss. */}
          <div
            aria-hidden="true"
            className="sticky top-0 z-10 flex shrink-0 touch-none items-center justify-center bg-field py-2.5 sm:hidden"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          >
            <span className="block h-1 w-10 rounded-full bg-rule" />
          </div>

          {/*
            One Title element (Base UI registers it as the dialog's accessible name; two instances would
            fight over that). Mobile: centred between two 44 px slots, close/save swap sides depending on
            whether the form has a save button. Desktop: original left-title/right-close row, untouched.
          */}
          <div className="flex shrink-0 items-center gap-2 px-5 pb-3 sm:items-start sm:justify-between sm:gap-4 sm:px-0 sm:pb-0">
            <div className="w-11 shrink-0 sm:hidden">{saveLabel && closeBtn}</div>
            <DialogPrimitive.Title className="m-0 min-w-0 grow truncate text-center text-[17px] font-semibold tracking-[-0.02em] sm:grow-0 sm:text-left sm:text-2xl sm:font-bold sm:tracking-[-0.03em]">
              {title}
            </DialogPrimitive.Title>
            <div className="flex w-11 shrink-0 justify-end sm:hidden">
              {saveLabel ? (
                <button type="button" onClick={() => saveBtnRef.current?.click()} className="text-[15px] font-semibold text-leaf">
                  {saveLabel}
                </button>
              ) : closeBtn}
            </div>
            <div className="hidden sm:block">{closeBtn}</div>
          </div>

          <div ref={contentRef} className="flex min-h-0 grow flex-col gap-6 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:px-0 sm:pb-0">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
