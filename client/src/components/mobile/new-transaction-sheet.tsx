"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/app/modal";
import { useNewTransaction } from "@/components/mobile/new-transaction-context";

/**
 * The tab bar's "Add" button opens this wherever the user is, instead of navigating to /mobile/transactions
 * first. The form itself is server-rendered once by the layout with a placeholder `back`; we patch it to
 * the current path on open so a save redirects back to the page the sheet was opened from.
 */
export function NewTransactionSheet({ title, closeLabel, children }: { title: string; closeLabel: string; children: ReactNode }) {
  const { open, setOpen } = useNewTransaction();
  const pathname = usePathname();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const back = formRef.current?.querySelector<HTMLInputElement>('input[name="back"]');
    if (back) back.value = pathname;
  }, [open, pathname]);

  return (
    <Modal title={title} closeLabel={closeLabel} open={open} onOpenChange={setOpen}>
      <div ref={formRef}>{children}</div>
    </Modal>
  );
}
