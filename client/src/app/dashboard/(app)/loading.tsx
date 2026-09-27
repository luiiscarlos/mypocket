import { getTranslations } from "next-intl/server";
import { Loading, Skel, SkelRows } from "@/components/app/ui";

// Home skeleton (design: InicioCargando).
export default async function HomeLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <Skel className="h-[260px]" />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <SkelRows count={3} />
        <SkelRows count={3} />
      </div>
    </Loading>
  );
}
