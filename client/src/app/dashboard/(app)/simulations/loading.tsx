import { getTranslations } from "next-intl/server";
import { Loading, Skel, SkelRows } from "@/components/app/ui";

// Design: SimulacionesCargando.
export default async function SimulationsLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <Skel className="h-12 w-2/3" />
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_1.3fr]">
        <Skel className="h-80" />
        <Skel className="h-80" />
      </div>
      <SkelRows count={3} />
    </Loading>
  );
}
