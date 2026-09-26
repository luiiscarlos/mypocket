import Link from "next/link";
import { useTranslations } from "next-intl";

const FREE = ["bank", "cash", "summary"] as const;
const PRO = ["banks", "analytics", "subscriptions", "ocr"] as const;

export function PlanCards() {
  const t = useTranslations("plans");
  return (
    <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-stretch lg:gap-16">
      <div className="flex w-full max-w-[410px] flex-col gap-8 border border-ink p-8 sm:p-10">
        <div className="flex items-baseline justify-between">
          <div className="text-[28px] font-extrabold tracking-[-0.03em]">{t("free")}</div>
          <div className="font-mono text-[40px] font-medium tracking-[-0.04em]">
            0 €<span className="text-sm text-ink-muted">{t("perMonth")}</span>
          </div>
        </div>
        <ul className="m-0 flex list-none flex-col p-0 text-base">
          {FREE.map((f, i) => (
            <li key={f} className={`border-t border-rule py-3.5 ${i === FREE.length - 1 ? "border-b" : ""}`}>
              {t(`freeFeatures.${f}`)}
            </li>
          ))}
        </ul>
        <Link
          href="/register"
          className="btn mt-auto flex h-[52px] items-center justify-center border border-ink text-[15px] font-semibold hover:no-underline"
        >
          {t("startFree")}
        </Link>
      </div>

      <div className="flex w-full max-w-[410px] flex-col gap-8 bg-brand p-8 text-cream sm:p-10">
        <div className="flex items-baseline justify-between">
          <div className="text-[28px] font-extrabold tracking-[-0.03em]">Pro</div>
          <div className="font-mono text-[40px] font-medium tracking-[-0.04em]">
            {t("price")} €<span className="text-sm text-mist">{t("perMonth")}</span>
          </div>
        </div>
        <ul className="m-0 flex list-none flex-col p-0 text-base">
          {PRO.map((f, i) => (
            <li key={f} className={`border-t border-cream/30 py-3.5 ${i === PRO.length - 1 ? "border-b" : ""}`}>
              {t(`proFeatures.${f}`)}
            </li>
          ))}
        </ul>
        <Link
          href="/register"
          className="btn mt-auto flex h-[52px] items-center justify-center bg-cream text-[15px] font-semibold text-brand hover:no-underline"
        >
          {t("tryPro")}
        </Link>
      </div>
    </div>
  );
}
