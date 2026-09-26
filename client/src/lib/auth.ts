import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Verified session (JWT signature checked) or redirect to /login. Use in every protected page and action. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { id: data.claims.sub, email: data.claims.email as string | undefined };
});

/** Only internal paths, so ?next= can't be used as an open redirect. */
export function safeNext(next: unknown, fallback = "/dashboard") {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : fallback;
}
