import { getTranslations } from "next-intl/server";
import { Loading, Skel, SkelRows } from "@/components/app/ui";

// Design: PatrimonioCargando.
export default async function NetWorthLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <div className="mt-[88px] flex flex-col gap-3.5">
        <Skel className="h-3.5 w-1/5" />
        <Skel className="h-20 w-[45%]" />
        <Skel className="h-3.5 w-full" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skel className="h-[72px]" />
        <Skel className="h-[72px]" />
        <Skel className="h-[72px]" />
      </div>
      <SkelRows count={3} />
      <SkelRows count={2} />
    </Loading>
  );
}
