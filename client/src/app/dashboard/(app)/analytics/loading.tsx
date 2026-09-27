import { getTranslations } from "next-intl/server";
import { Loading, Skel, SkelRows } from "@/components/app/ui";

// Design: AnalisisCargando (3 KPIs, bars, monthly chart, table).
export default async function AnalyticsLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <div className="grid grid-cols-3 gap-6">
        <Skel className="h-24" />
        <Skel className="h-24" />
        <Skel className="h-24" />
      </div>
      <Skel className="h-56" />
      <SkelRows count={4} height="h-10" />
    </Loading>
  );
}
