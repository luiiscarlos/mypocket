"use client";

import { useRef } from "react";
import { Switch } from "@/components/ui/switch";

/** shadcn Switch that submits its server-action form on change (the form carries the new value). */
export function SubmitSwitch({ checked, label }: { checked: boolean; label: string }) {
  const ref = useRef<HTMLElement>(null);
  return <Switch ref={ref} defaultChecked={checked} aria-label={label} onCheckedChange={() => ref.current?.closest("form")?.requestSubmit()} />;
}
