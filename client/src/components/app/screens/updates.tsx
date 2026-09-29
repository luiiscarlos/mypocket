import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Empty, PageHeader } from "@/components/app/ui";
import { getUpdates } from "@/lib/queries";

export async function UpdatesScreen() {

  const locale = await getLocale();
  const [t, format, { appUpdates }] = await Promise.all([
    getTranslations("app.updates"),
    getFormatter(),
    getUpdates(locale).then((appUpdates) => ({ appUpdates })),
  ]);

  return (
    <>
      <PageHeader title={t("title")} />
      {appUpdates.length === 0 ? (
        <Empty>{t("empty")}</Empty>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-10 p-0">
          {appUpdates.map((u) => (
            <li key={u.version} className="grid grid-cols-1 gap-3 border-t-[3px] border-ink pt-5 lg:grid-cols-[200px_1fr]">
              <div className="flex flex-col gap-1 font-mono text-sm">
                <span className="text-leaf">v{u.version}</span>
                <span className="text-ink-muted">{format.dateTime(new Date(`${u.publishedAt}T00:00:00`), { dateStyle: "long" })}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{u.title}</h2>
                <p className="m-0 max-w-[720px] text-base leading-[1.6] text-ink-muted">{u.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
