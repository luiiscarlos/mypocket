"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const Ctx = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

/** Lets the tab bar's "Add" button open the new-transaction sheet from whatever mobile page it's on. */
export function NewTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useNewTransaction() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNewTransaction must be used within NewTransactionProvider");
  return ctx;
}
