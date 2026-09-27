import { getTranslations } from "next-intl/server";
import { Loading, Skel } from "@/components/app/ui";

// Design: NovedadesCargando (3 versions).
export default async function UpdatesLoading() {
  const t = await getTranslations("app");
  return (
    <Loading label={t("loading")}>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`grid grid-cols-1 gap-3 lg:grid-cols-[200px_1fr] ${i === 0 ? "" : ""}`}>
          <Skel className="h-10" />
          <div className="flex flex-col gap-2"><Skel className="h-7 w-1/2" /><Skel className="h-4" /><Skel className="h-4 w-3/4" /></div>
        </div>
      ))}
    </Loading>
  );
}
