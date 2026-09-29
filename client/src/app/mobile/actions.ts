"use server";

import { redirect } from "next/navigation";
import { setViewPreference } from "@/lib/preferences";

/** Switch between the desktop app and the mobile app; remembered so the proxy stops redirecting. */
export async function setView(formData: FormData) {
  const view = formData.get("view") === "mobile" ? "mobile" : "desktop";
  await setViewPreference(view);
  redirect(view === "mobile" ? "/mobile" : "/dashboard");
}
