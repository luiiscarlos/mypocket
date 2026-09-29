import { getTranslations } from "next-intl/server";
import { Loading, Skel, SkelRows } from "@/components/app/ui";

// One-column skeleton for every /mobile screen.
export default async function MobileLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <Skel className="h-[180px] rounded-[20px]" />
      <SkelRows count={4} height="h-[52px]" />
    </Loading>
  );
}
