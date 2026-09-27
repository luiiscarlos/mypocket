import "server-only";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { safeNext } from "@/lib/auth";
import type messages from "../../messages/es.json";

export type AppErrorCode = keyof typeof messages.app.errors;
export type AppMessageCode = keyof typeof messages.app.messages;

const API_CODES: Record<string, AppErrorCode> = {
  BAD_USER_INPUT: "invalid",
  NOT_FOUND: "notFound",
  FORBIDDEN: "readOnly",
  CONFLICT: "conflict",
  PLAN_LIMIT: "planLimit",
  RATE_LIMITED: "rateLimited",
};

export const errorCode = (e: unknown): AppErrorCode =>
  (e instanceof ApiError && e.code && API_CODES[e.code]) || "generic";

/** Where the form wants to go back to: an internal path from the hidden "back" field. */
export const backOf = (formData: FormData) => safeNext(formData.get("back"), "/dashboard");

/** Redirect to `path` adding ?error= or ?message= (codes only: the page translates them). */
export function backWith(path: string, params: { error?: AppErrorCode; message?: AppMessageCode }): never {
  const url = new URL(path, "http://local");
  url.searchParams.delete("error");
  url.searchParams.delete("message");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  redirect(url.pathname + url.search);
}

/** Runs an API call; API errors go back to the form as a code, anything else is a real bug and is thrown. */
export async function attempt<T>(back: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) backWith(back, { error: errorCode(e) });
    throw e;
  }
}

export const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

/** Accepts "12,50" and "12.50". NaN when empty or invalid, so the API rejects it. */
export const num = (formData: FormData, name: string) => Number(text(formData, name).replace(",", ".") || NaN);

export const optional = (value: string) => value || null;
