import Link from "next/link";
import { useTranslations } from "next-intl";
import { GreenHero, SiteFooter, SitePage, eyebrow } from "./chrome";

// Section keys in display order (titles in messages legal.docs.*); bodies are pending legal text.
const DOCS = {
  privacy: ["controller", "data", "bank", "purpose", "retention", "rights", "contact"],
  terms: ["object", "account", "plans", "bank", "liability", "termination", "law"],
} as const;

export function LegalDocument({ doc }: { doc: keyof typeof DOCS }) {
  const t = useTranslations("legal");
  const items = DOCS[doc].map((key, i) => ({
    id: `s${i + 1}`,
    n: String(i + 1).padStart(2, "0"),
    title: t(`docs.${doc}.sections.${key}` as "docs.privacy.sections.controller"),
  }));
  const title = t(`docs.${doc}.title`);

  return (
    <SitePage>
      <GreenHero className="pb-16 lg:pb-20">
        <div className="flex flex-col justify-between gap-6 pt-16 lg:flex-row lg:items-end lg:pt-20">
          <div className="flex flex-col gap-6">
            <div className={eyebrow}>{t("eyebrow")}</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] lg:text-[96px]">{title}</h1>
          </div>
          <div className="font-mono text-[13px] text-mist">{t("lastUpdated", { date: t("date") })}</div>
        </div>
      </GreenHero>

      <section className="grid grow grid-cols-1 items-start gap-12 band py-20 lg:grid-cols-12 lg:gap-x-6 lg:py-24">
        <nav aria-label={t("index")} className="flex flex-col border-t-[3px] border-ink lg:sticky lg:top-6 lg:col-span-3">
          {items.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="flex gap-3.5 border-b border-rule py-3.5 text-[15px] hover:underline">
              <span className="pt-0.5 font-mono text-xs text-leaf">{s.n}</span>
              {s.title}
            </a>
          ))}
          <div className="flex gap-4 pt-6 text-sm font-semibold">
            <Link href="/privacy" className="underline">{t("privacy")}</Link>
            <Link href="/terms" className="underline">{t("terms")}</Link>
          </div>
        </nav>
        <article className="flex flex-col gap-14 lg:col-span-7 lg:col-start-5">
          {items.map((s) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-6 flex-col gap-4">
              <h2 className="m-0 flex items-baseline gap-5 text-[30px] font-extrabold tracking-[-0.03em]">
                <span className="font-mono text-sm font-medium text-leaf">{s.n}</span>
                {s.title}
              </h2>
              <p className="m-0 text-[17px] leading-[1.7] text-ink-legal">{t("pending")}</p>
            </section>
          ))}
        </article>
      </section>

      <SiteFooter />
    </SitePage>
  );
}
