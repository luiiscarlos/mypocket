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
        className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[640px] overflow-y-auto border-[3px] border-ink bg-paper p-0 text-ink backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={closeLabel} className="-m-2 inline-flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent text-ink">
              <X size={20} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
