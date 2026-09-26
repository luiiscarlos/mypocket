"use server";

import { ApiError, gql } from "@/lib/api";

export type ContactState = {
  status: "idle" | "sent" | "error";
  message?: string;
  values?: Record<string, string>;
};

const TOPICS = ["SUPPORT", "BANK", "BILLING", "OTHER"];

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const get = (k: string) => (typeof formData.get(k) === "string" ? (formData.get(k) as string) : "");
  const values = { name: get("name"), email: get("email"), topic: get("topic"), message: get("message") };

  // Honeypot: humans never see this field; pretend success so bots don't retry.
  if (get("website")) return { status: "sent" };
  if (formData.get("privacy") !== "on") {
    return { status: "error", message: "Debes aceptar la política de privacidad", values };
  }

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
    if (e instanceof ApiError) {
      const detail = e.code === "BAD_USER_INPUT" ? "Revisa los campos: nombre, email válido y mensaje son obligatorios" : e.message;
      return { status: "error", message: detail, values };
    }
    return { status: "error", message: "No se pudo enviar el mensaje, inténtalo más tarde", values };
  }
}
