"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Notice, inputClass, labelClass } from "@/components/site/auth";
import { sendContact, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: "idle" });
  const v = state.values ?? {};

  if (state.status === "sent") {
    return (
      <div className="lg:col-span-7 lg:col-start-6">
        <Notice kind="status">Mensaje enviado. Te responderemos por email.</Notice>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
      {state.status === "error" && <Notice kind="error">{state.message}</Notice>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className={labelClass}>
          Nombre
          <input type="text" name="name" autoComplete="name" required maxLength={100} defaultValue={v.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" name="email" autoComplete="email" required maxLength={254} defaultValue={v.email} className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        Motivo
        <select name="topic" defaultValue={v.topic ?? "SUPPORT"} className={`${inputClass} px-3`}>
          <option value="SUPPORT">Soporte</option>
          <option value="BANK">Conexión con un banco</option>
          <option value="BILLING">Facturación</option>
          <option value="OTHER">Otro</option>
        </select>
      </label>
      <label className={labelClass}>
        Mensaje
        <textarea
          name="message"
          rows={7}
          required
          maxLength={5000}
          defaultValue={v.message}
          className={`${inputClass} h-auto resize-y py-3.5`}
        />
      </label>
      {/* Honeypot for bots: hidden from people and assistive tech. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] size-px opacity-0" />
      <div className="flex items-center gap-3 text-[15px] text-ink-muted">
        <input id="privacy" type="checkbox" name="privacy" required className="size-5 shrink-0 accent-brand" />
        <label htmlFor="privacy">
          He leído la{" "}
          <Link href="/privacy" className="text-ink underline">política de privacidad</Link>
        </label>
      </div>
      <button
        disabled={pending}
        className="h-14 cursor-pointer self-start border-0 bg-brand px-8 font-sans text-base font-semibold text-cream hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
