import { getTranslations } from "next-intl/server";
import type messages from "../../messages/es.json";

export type AuthErrorCode = keyof typeof messages.auth.errors;
export type AuthMessageCode = keyof typeof messages.auth.messages;

/** Translate ?error= / ?message= codes. Unknown values are dropped, so the URL can't inject text. */
export async function authNotice(params: { error?: string; message?: string }) {
  const t = await getTranslations("auth");
  const pick = (group: "errors" | "messages", code?: string) => {
    const key = `${group}.${code}` as Parameters<typeof t>[0];
    return code && t.has(key) ? t(key) : undefined;
  };
  return { error: pick("errors", params.error), message: pick("messages", params.message) };
}

/** Same as authNotice for dashboard pages (messages app.errors / app.messages). */
export async function appNotice(params: { error?: string; message?: string }) {
  const t = await getTranslations("app");
  const pick = (group: "errors" | "messages", code?: string) => {
    const key = `${group}.${code}` as Parameters<typeof t>[0];
    return code && t.has(key) ? t(key) : undefined;
  };
  return { error: pick("errors", params.error), message: pick("messages", params.message) };
}
