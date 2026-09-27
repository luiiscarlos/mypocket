import { getTranslations } from "next-intl/server";
import { Loading, Skel, SkelRows } from "@/components/app/ui";

// Design: MovimientosCargando (5 rows of 60 px).
export default async function TransactionsLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      <Skel className="mt-[88px] h-[320px]" />
      <SkelRows count={5} height="h-[60px]" />
    </Loading>
  );
}
