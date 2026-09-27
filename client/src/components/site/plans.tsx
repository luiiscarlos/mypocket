import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const FREE = ["accounts", "cash", "recurring", "simulations", "summary"] as const;
const PRO = ["unlimited", "bank", "investments", "analytics", "ocr"] as const;

/** Plan cards, design v3 ("PlanCards"): Free with a 1 px border, Pro with the green border and "Recommended". */
export function PlanCards() {
  const t = useTranslations("plans");
  const plans = [
    { key: "free", price: "0 €", items: FREE.map((f) => t(`freeFeatures.${f}`)), cta: t("startFree"), pro: false },
    { key: "pro", price: `${t("price")} €`, items: PRO.map((f) => t(`proFeatures.${f}`)), cta: t("tryPro"), pro: true },
  ] as const;
  return (
    <div className="grid w-full max-w-[860px] grid-cols-1 gap-5 md:grid-cols-2">
      {plans.map((p) => (
        <div key={p.key} className={`flex flex-col gap-6 rounded-block bg-field p-9 ${p.pro ? "border-2 border-leaf" : "border border-rule"}`}>
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-between">
              <span className="text-xl font-bold">{t(p.key)}</span>
              {p.pro && <span className="inline-flex h-[26px] items-center rounded-full bg-ok-bg px-2.5 text-xs font-semibold text-leaf">{t("recommended")}</span>}
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-5xl font-medium tracking-[-0.04em]">{p.price}</span>
              <span className="text-[15px] text-ink-muted">{t("perMonth")}</span>
            </span>
            <span className="text-[15px] text-ink-muted">{t(`${p.key}Tagline`)}</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
            {p.items.map((item) => (
              <li key={item} className="flex items-center gap-2.5"><Check size={18} strokeWidth={2.2} className="shrink-0 text-leaf" aria-hidden />{item}</li>
            ))}
          </ul>
          <Link
            href="/register"
            className={`btn mt-auto flex h-[50px] items-center justify-center rounded-[14px] text-[15px] font-semibold hover:no-underline ${p.pro ? "bg-leaf text-on-leaf" : "bg-band text-ink"}`}
          >
            {p.cta}
          </Link>
        </div>
      ))}
    </div>
  );
}
