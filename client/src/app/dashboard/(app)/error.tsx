"use client";

import { useTranslations } from "next-intl";
import { dangerBtn } from "@/components/app/ui";

// Design: InicioError. No technical codes on screen; details stay in the server logs.
export default function AppError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  const t = useTranslations("app.error");
  return (
    <div role="alert" className="mt-[88px] flex flex-wrap items-center justify-between gap-6 border border-danger bg-danger-bg p-8 text-danger-ink">
      <div className="flex flex-col gap-1.5">
        <span className="text-xl font-bold">{t("title")}</span>
        <span className="text-[15px]">{t("text")}</span>
      </div>
      <button type="button" onClick={() => unstable_retry()} className={dangerBtn}>{t("retry")}</button>
    </div>
  );
}
