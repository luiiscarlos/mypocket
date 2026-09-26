"use server";

import { ApiError, gql } from "@/lib/api";

export type ContactError = "privacy" | "fields" | "rateLimited" | "generic";

export type ContactState = {
  status: "idle" | "sent" | "error";
  /** Translated in the form (contact.form.errors), never raw API text. */
  error?: ContactError;
  values?: Record<string, string>;
};

const TOPICS = ["SUPPORT", "BANK", "BILLING", "OTHER"];

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const get = (k: string) => (typeof formData.get(k) === "string" ? (formData.get(k) as string) : "");
  const values = { name: get("name"), email: get("email"), topic: get("topic"), message: get("message") };

  // Honeypot: humans never see this field; pretend success so bots don't retry.
  if (get("website")) return { status: "sent" };
  if (formData.get("privacy") !== "on") return { status: "error", error: "privacy", values };

  try {
    await gql(`mutation($i: ContactMessageInput!) { sendContactMessage(input: $i) }`, {
      i: {
        name: values.name,
        email: values.email.trim(),
        topic: TOPICS.includes(values.topic) ? values.topic : "OTHER",
        message: values.message,
        acceptPrivacy: true,
      },
    });
    return { status: "sent" };
  } catch (e) {
    const code = e instanceof ApiError ? e.code : undefined;
    const error: ContactError = code === "BAD_USER_INPUT" ? "fields" : code === "RATE_LIMITED" ? "rateLimited" : "generic";
    return { status: "error", error, values };
  }
}
