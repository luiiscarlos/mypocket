import { getTranslations } from "next-intl/server";
import { Loading, SkelRows } from "@/components/app/ui";

export default async function SettingsLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <div className=""><SkelRows count={3} /></div>
      <SkelRows count={3} />
    </Loading>
  );
}
