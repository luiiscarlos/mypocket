import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero, SiteFooter, SitePage, eyebrow } from "@/components/site/chrome";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("faq") };
}

// Question keys per group, in display order. Bracketed answers in messages are pending texts from the design.
const GROUPS = {
  banks: ["safe", "which", "several", "disconnect"],
  cash: ["track", "noBank"],
  tickets: ["how", "cash"],
  plans: ["free", "cancel", "payment"],
  account: ["who", "delete"],
} as const;

const groups = (Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((key, i) => ({
  key,
  id: `g${i + 1}`,
  n: String(i + 1).padStart(2, "0"),
  items: GROUPS[key] as readonly string[],
}));

export default function FaqPage() {
  const t = useTranslations("faq");
  // Keys are checked by GROUPS; the cast only widens the template literal for the typed t().
  const q = (g: string, item: string, part: "q" | "a") => t(`groups.${g}.items.${item}.${part}` as "groups.banks.items.safe.q");
  return (
    <SitePage>
      <PageHero current="faq" className="pb-16 lg:pb-20">
        <div className="grid grid-cols-1 items-end gap-8 pt-16 lg:grid-cols-12 lg:gap-x-6 lg:pt-20">
          <div className="flex flex-col gap-7 lg:col-span-8">
            <div className={eyebrow}>{t("eyebrow")}</div>
            <h1 className="m-0 text-6xl font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-8xl lg:text-[112px]">
              {t("title")}
            </h1>
          </div>
          <p className="m-0 text-[19px] leading-normal text-ink-muted lg:col-span-4 lg:col-start-9">
            {t("lead")}
          </p>
        </div>
      </PageHero>

      <section className="grid grow grid-cols-1 items-start gap-12 band py-20 lg:grid-cols-12 lg:gap-x-6 lg:py-24">
        <nav aria-label={t("categories")} className="flex flex-col border-t-[3px] border-ink lg:sticky lg:top-6 lg:col-span-3">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="flex justify-between border-b border-rule py-3.5 text-base hover:underline">
              <span className="flex gap-3.5">
                <span className="pt-[3px] font-mono text-xs text-ink">{g.n}</span>
                {t(`groups.${g.key}.title`)}
              </span>
              <span className="pt-[3px] font-mono text-xs text-ink-muted">{g.items.length}</span>
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-[72px] lg:col-span-8 lg:col-start-5">
          {groups.map((g, gi) => (
            <section key={g.id} id={g.id} className="flex scroll-mt-6 flex-col">
              <h2 className="mb-5 mt-0 flex items-baseline gap-5 text-4xl font-extrabold tracking-[-0.04em]">
                <span className="font-mono text-sm font-medium tracking-normal text-ink">{g.n}</span>
                {t(`groups.${g.key}.title`)}
              </h2>
              <Accordion multiple defaultValue={gi === 0 ? [g.items[0]] : []}>
                {g.items.map((item) => (
                  <AccordionItem key={item} value={item} className="border-t border-ink not-last:border-b-0">
                    <AccordionTrigger className="min-h-11 items-center gap-6 rounded-none py-5 text-xl font-semibold tracking-[-0.01em] hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
                      {q(g.key, item, "q")}
                      <Plus size={18} strokeWidth={2.2} aria-hidden className="shrink-0 text-ink transition-transform group-aria-expanded/accordion-trigger:rotate-45" />
                    </AccordionTrigger>
                    <AccordionContent hiddenUntilFound className="pb-6">
                      <p className="m-0 max-w-[720px] text-base leading-[1.65] text-ink-muted">{q(g.key, item, "a")}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="border-t border-ink" />
            </section>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-8 bg-band band py-16 sm:flex-row sm:items-center lg:py-40">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-4xl font-extrabold leading-[0.95] tracking-[-0.045em] lg:text-5xl">{t("notFound")}</h2>
          <p className="m-0 text-[17px] text-ink-muted">{t("writeUs")}</p>
        </div>
        <Link href="/contact" className="btn inline-flex h-14 shrink-0 items-center self-start bg-leaf px-7 text-base font-semibold text-on-leaf hover:opacity-90 hover:no-underline sm:self-auto">
          {t("contact")}
        </Link>
      </section>

      <SiteFooter />
    </SitePage>
  );
}
