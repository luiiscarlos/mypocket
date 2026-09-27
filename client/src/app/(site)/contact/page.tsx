import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PageHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("contact") };
}

export default function ContactPage() {
  const t = useTranslations("contact");
  return (
    <SitePage>
      <PageHero className="pb-20 lg:pb-[88px]">
        <div className="flex flex-col gap-6 pt-16 lg:pt-[88px]">
          <div className={eyebrow}>{t("eyebrow")}</div>
          <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">{t("title")}</h1>
        </div>
      </PageHero>

      <section className="grid grow grid-cols-1 items-start gap-12 band py-20 lg:grid-cols-12 lg:gap-x-6 lg:py-24">
        <div className="flex flex-col gap-8 lg:col-span-4">
          <p className="m-0 text-[19px] leading-[1.55] text-ink-muted">
            {t("lead")}
          </p>
          <dl className="m-0 flex flex-col">
            <div className="flex flex-col gap-1.5 border-t border-ink py-[18px]">
              <dt className="font-mono text-xs tracking-[0.06em] text-ink-muted">{t("email")}</dt>
              <dd className="m-0 text-lg font-semibold">{t("emailValue")}</dd>
            </div>
            <div className="flex flex-col gap-1.5 border-y border-ink py-[18px]">
              <dt className="font-mono text-xs tracking-[0.06em] text-ink-muted">{t("responseTime")}</dt>
              <dd className="m-0 text-lg font-semibold">{t("responseTimeValue")}</dd>
            </div>
          </dl>
        </div>
        <ContactForm />
      </section>

      <SiteFooter />
    </SitePage>
  );
}
