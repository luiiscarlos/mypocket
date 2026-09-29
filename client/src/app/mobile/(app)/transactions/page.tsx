import { getFormatter, getTranslations } from "next-intl/server";
import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/dashboard/actions";
import { Modal } from "@/components/app/modal";
import { TransactionForm } from "@/components/app/transaction-form";
import { Empty, ListControls, PageNotice, dangerBtn, primaryBtn, secondaryBtn } from "@/components/app/ui";
import { appNotice } from "@/lib/auth-codes";
import { getTransactions, parseTxSearch } from "@/lib/queries";

const PAGE = "/mobile/transactions";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("transactions") };
}

// Mobile transactions: history grouped by day; each row opens its edit sheet; filters and
// "new transaction" live in bottom sheets (?new=1 opens it, as the tab bar's "Add" does).
export default async function MobileTransactionsPage({ searchParams }: PageProps<"/mobile/transactions">) {
  const sp = await searchParams;
  const { filter, orderBy, orders, types } = parseTxSearch(sp);
  const [t, format, notice, data] = await Promise.all([
    getTranslations("app.transactions"),
    getFormatter(),
    appNotice(sp as { error?: string; message?: string }),
    getTransactions(filter, orderBy),
  ]);
  const { me } = data;
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const dayLabel = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { weekday: "long", day: "numeric", month: "long" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const all = { value: "", label: t("filters.all") };
  const filtered = Object.values(filter).some(Boolean) || orderBy !== "DATE_DESC";

  // Group by day only in date order; amount order is a flat list.
  const byDate = orderBy.startsWith("DATE");
  const groups = new Map<string, typeof data.transactions>();
  for (const tx of data.transactions) {
    const key = byDate ? tx.occurredOn : "all";
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }

  return (
    <>
      <PageNotice {...notice} />

      <div className="flex gap-2">
        {!me.readOnly && (
          <Modal title={t("new")} trigger={<><Plus size={16} aria-hidden />{t("new")}</>} triggerClassName={`${primaryBtn} grow`} closeLabel={t("close")} defaultOpen={sp.new === "1"}>
            <TransactionForm back={PAGE} currency={me.currency} accounts={data.accounts} categories={data.categories} />
          </Modal>
        )}
        <Modal
          title={t("filters.title")}
          trigger={<><SlidersHorizontal size={16} aria-hidden />{t("filters.title")}{filtered && <span className="size-2 rounded-full bg-leaf" aria-hidden />}</>}
          triggerClassName={secondaryBtn}
          closeLabel={t("close")}
        >
          <ListControls
            action={PAGE}
            apply={t("filters.apply")}
            reset={t("filters.reset")}
            controls={[
              { name: "type", label: t("filters.type"), value: filter.type, options: [all, ...types.map((v) => ({ value: v, label: t(v) }))] },
              { name: "account", label: t("filters.account"), value: filter.accountId, options: [all, ...data.accounts.map((a) => ({ value: a.id, label: a.name }))] },
              { name: "category", label: t("filters.category"), value: filter.categoryId, options: [all, ...data.categories.map((c) => ({ value: c.id, label: c.name }))] },
              { name: "from", label: t("filters.from"), value: filter.from, type: "date" },
              { name: "to", label: t("filters.to"), value: filter.to, type: "date" },
              { name: "sort", label: t("filters.sort"), value: orderBy === "DATE_DESC" ? undefined : orderBy, options: orders.map((o) => ({ value: o === "DATE_DESC" ? "" : o, label: t(`filters.orders.${o}`) })) },
            ]}
          />
        </Modal>
      </div>

      {data.transactions.length === 0 ? (
        <Empty>{filtered ? t("noMatches") : t("empty")}</Empty>
      ) : (
        [...groups].map(([day, items]) => (
          <section key={day} className="flex flex-col">
            {byDate && <h2 className="m-0 pb-1 text-[13px] font-semibold text-ink-muted first-letter:uppercase">{dayLabel(day)}</h2>}
            <ul className="m-0 flex list-none flex-col p-0">
              {items.map((tx) => {
                const title = tx.note ?? tx.category?.name ?? t(tx.type);
                const content = (
                  <>
                    <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-control bg-band text-sm font-bold text-ink-muted">{title.charAt(0).toUpperCase()}</span>
                    <span className="flex min-w-0 flex-col gap-0.5 text-left">
                      <span className="truncate text-[15px] font-semibold">{title}</span>
                      <span className="truncate text-xs text-ink-muted">
                        {[tx.category?.name, tx.accountId && accountName.get(tx.accountId), tx.source === "RECURRING" && t("recurringTag")].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className={`font-mono text-[15px] tabular-nums ${tx.type === "INCOME" ? "text-leaf" : ""}`}>{tx.type === "INCOME" ? "+" : "−"}{money(tx.amount, tx.currency)}</span>
                  </>
                );
                const rowClass = "grid min-h-[56px] w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-0 border-b border-rule bg-transparent py-2 font-sans text-ink";
                return (
                  <li key={tx.id}>
                    {me.readOnly ? (
                      <div className={rowClass}>{content}</div>
                    ) : (
                      <Modal title={t("editTitle")} trigger={content} triggerLabel={`${t("edit")}: ${title}`} triggerClassName={`${rowClass} cursor-pointer`} closeLabel={t("close")}>
                        <TransactionForm back={PAGE} currency={me.currency} accounts={data.accounts} categories={data.categories} tx={tx} />
                        <form action={deleteTransaction} className="border-t border-rule pt-4">
                          <input type="hidden" name="back" value={PAGE} />
                          <input type="hidden" name="id" value={tx.id} />
                          <button className={`${dangerBtn} w-full`}><Trash2 size={16} aria-hidden />{t("delete")}</button>
                        </form>
                      </Modal>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
