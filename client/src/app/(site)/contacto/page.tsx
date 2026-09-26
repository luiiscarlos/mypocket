import type { Metadata } from "next";
import { GreenHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contacto" };

// Pending texts from the design.
const CONTACT_EMAIL = "[EMAIL DE CONTACTO]";
const RESPONSE_TIME = "[PLAZO DE RESPUESTA]";

export default function ContactPage() {
  return (
    <SitePage>
      <GreenHero className="pb-20 lg:pb-[88px]">
        <div className="flex flex-col gap-6 pt-16 lg:pt-[88px]">
          <div className={eyebrow}>CONTACTO</div>
          <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">Hablemos.</h1>
        </div>
      </GreenHero>

      <section className="grid grow grid-cols-1 items-start gap-12 px-5 py-20 lg:grid-cols-12 lg:gap-x-6 lg:px-20 lg:py-24">
        <div className="flex flex-col gap-8 lg:col-span-4">
          <p className="m-0 text-[19px] leading-[1.55] text-ink-muted">
            Dudas, problemas con un banco o ideas para mejorar mypocket. Escríbenos y te respondemos por email.
          </p>
          <dl className="m-0 flex flex-col">
            <div className="flex flex-col gap-1.5 border-t border-ink py-[18px]">
              <dt className="font-mono text-xs tracking-[0.06em] text-ink-muted">EMAIL</dt>
              <dd className="m-0 text-lg font-semibold">{CONTACT_EMAIL}</dd>
            </div>
            <div className="flex flex-col gap-1.5 border-y border-ink py-[18px]">
              <dt className="font-mono text-xs tracking-[0.06em] text-ink-muted">TIEMPO DE RESPUESTA</dt>
              <dd className="m-0 text-lg font-semibold">{RESPONSE_TIME}</dd>
            </div>
          </dl>
        </div>
        <ContactForm />
      </section>

      <SiteFooter />
    </SitePage>
  );
}
