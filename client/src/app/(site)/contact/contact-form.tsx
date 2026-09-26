"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Notice, inputClass, labelClass } from "@/components/forms";
import { sendContact, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: "idle" });
  const t = useTranslations("contact.form");
  const v = state.values ?? {};

  if (state.status === "sent") {
    return (
      <div className="lg:col-span-7 lg:col-start-6">
        <Notice kind="status">{t("sent")}</Notice>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
      {state.status === "error" && <Notice kind="error">{state.error && t(`errors.${state.error}`)}</Notice>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className={labelClass}>
          {t("name")}
          <input type="text" name="name" autoComplete="name" required maxLength={100} defaultValue={v.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("email")}
          <input type="email" name="email" autoComplete="email" required maxLength={254} defaultValue={v.email} className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        {t("topic")}
        <select name="topic" defaultValue={v.topic ?? "SUPPORT"} className={`${inputClass} px-3`}>
          {(["SUPPORT", "BANK", "BILLING", "OTHER"] as const).map((topic) => (
            <option key={topic} value={topic}>{t(`topics.${topic}`)}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        {t("message")}
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
        <input id="privacy" type="checkbox" name="privacy" required className="size-5 shrink-0 accent-leaf" />
        <label htmlFor="privacy">
          {t("privacyPrefix")}{" "}
          <Link href="/privacy" className="text-ink underline">{t("privacyLink")}</Link>
        </label>
      </div>
      <button
        disabled={pending}
        className="h-14 cursor-pointer self-start border-0 bg-brand px-8 font-sans text-base font-semibold text-cream hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
