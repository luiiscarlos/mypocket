import { getFormatter, getTranslations } from "next-intl/server";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/dashboard/actions";
import { Modal } from "@/components/app/modal";
import { TransactionForm } from "@/components/app/transaction-form";
import { Empty, List, ListControls, PageHeader, PageNotice, Row, Section, dangerLink, primaryBtn, smallButton } from "@/components/app/ui";
import { getTransactions, parseTxSearch } from "@/lib/queries";
import { appNotice } from "@/lib/auth-codes";

const PAGE = "/dashboard/transactions";
export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("transactions") };
}

export default async function TransactionsPage({ searchParams }: PageProps<"/dashboard/transactions">) {
  const sp = await searchParams;
  const { filter, orderBy, orders: ORDERS, types: TYPES } = parseTxSearch(sp);

  const [t, format, notice, data] = await Promise.all([
    getTranslations("app.transactions"),
    getFormatter(),
    appNotice(sp as { error?: string; message?: string }),
    getTransactions(filter, orderBy),
  ]);
  const { me } = data;
  const money = (v: number, currency: string) => format.number(v, { style: "currency", currency });
  const date = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00`), { day: "numeric", month: "short", year: "numeric" });
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const all = { value: "", label: t("filters.all") };

  return (
    <>
      <PageHeader title={t("title")}>
        {!me.readOnly && (
          <Modal title={t("new")} trigger={<><Plus size={16} aria-hidden />{t("new")}</>} triggerClassName={primaryBtn} closeLabel={t("close")} defaultOpen={sp.new === "1"}>
            <TransactionForm back={PAGE} currency={me.currency} accounts={data.accounts} categories={data.categories} />
          </Modal>
        )}
      </PageHeader>
      <PageNotice {...notice} />

      <Section title={t("history")} aside={<span className="font-mono text-[13px] text-ink-muted">{t("count", { count: data.transactions.length })}</span>}>
        <ListControls
          action={PAGE}
          apply={t("filters.apply")}
          reset={t("filters.reset")}
          controls={[
            { name: "type", label: t("filters.type"), value: filter.type, options: [all, ...TYPES.map((v) => ({ value: v, label: t(v) }))] },
            { name: "account", label: t("filters.account"), value: filter.accountId, options: [all, ...data.accounts.map((a) => ({ value: a.id, label: a.name }))] },
            { name: "category", label: t("filters.category"), value: filter.categoryId, options: [all, ...data.categories.map((c) => ({ value: c.id, label: c.name }))] },
            { name: "from", label: t("filters.from"), value: filter.from, type: "date" },
            { name: "to", label: t("filters.to"), value: filter.to, type: "date" },
            { name: "sort", label: t("filters.sort"), value: orderBy === "DATE_DESC" ? undefined : orderBy, options: ORDERS.map((o) => ({ value: o === "DATE_DESC" ? "" : o, label: t(`filters.orders.${o}`) })) },
          ]}
        />
        {data.transactions.length === 0 ? (
          <Empty>{Object.values(filter).some(Boolean) ? t("noMatches") : t("empty")}</Empty>
        ) : (
          <List>
            {data.transactions.map((tx) => (
              <Row
                key={tx.id}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {tx.note ?? tx.category?.name ?? t(tx.type)}
                    {tx.source === "RECURRING" && <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-ink-muted">{t("recurringTag")}</span>}
                  </span>
                }
                meta={[date(tx.occurredOn), tx.category?.name, tx.accountId && accountName.get(tx.accountId)].filter(Boolean).join(" · ")}
                value={<span className={tx.type === "INCOME" ? "text-leaf" : ""}>{tx.type === "INCOME" ? "+" : "−"}{money(tx.amount, tx.currency)}</span>}
              >
                {!me.readOnly && (
                  <div className="flex items-center gap-1">
                  <Modal title={t("editTitle")} trigger={<Pencil size={16} aria-hidden />} triggerLabel={t("edit")} triggerClassName={`${smallButton} w-11 px-0`} closeLabel={t("close")}>
                    <TransactionForm back={PAGE} currency={me.currency} accounts={data.accounts} categories={data.categories} tx={tx} />
                  </Modal>
                  <form action={deleteTransaction}>
                    <input type="hidden" name="back" value={PAGE} />
                    <input type="hidden" name="id" value={tx.id} />
                    <button className={`${dangerLink} inline-flex items-center`} aria-label={t("delete")} title={t("delete")}><Trash2 size={16} aria-hidden /></button>
                  </form>
                  </div>
                )}
              </Row>
            ))}
          </List>
        )}
      </Section>
    </>
  );
}
