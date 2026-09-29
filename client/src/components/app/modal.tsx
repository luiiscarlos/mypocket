"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Native <dialog> opened by its own trigger button (focus trap, Esc and focus return come from the browser).
 * The form inside is a normal server-action form: the dialog closes as soon as it submits and the page
 * shows the result notice after the redirect.
 */
export function Modal({
  title, trigger, triggerClassName, triggerLabel, closeLabel, defaultOpen = false, children,
}: {
  title: string; trigger: ReactNode; triggerClassName: string; triggerLabel?: string; closeLabel: string; defaultOpen?: boolean; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal();
  }, [defaultOpen]);

  return (
    <>
      <button type="button" className={triggerClassName} aria-label={triggerLabel} title={triggerLabel} onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        // Close after the submit event has been handed to the form's action.
        onSubmit={() => setTimeout(() => ref.current?.close(), 0)}
        // A click on the backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => e.target === ref.current && ref.current.close()}
        // Phones: bottom sheet (full width, anchored to the bottom, rounded top only, safe-area padding).
        className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[640px] overflow-y-auto rounded-[28px] border border-rule bg-field p-0 text-ink shadow-float backdrop:bg-black/50 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:max-h-[90dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:border-b-0 max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex flex-col gap-6 p-5 sm:p-8">
          <span aria-hidden="true" className="mx-auto -mt-2 block h-1 w-10 rounded-full bg-rule sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="m-0 text-2xl font-bold tracking-[-0.03em]">{title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={closeLabel} className="-m-2 inline-flex size-11 cursor-pointer items-center rounded-full hover:bg-band justify-center border-0 bg-transparent text-ink">
              <X size={20} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
