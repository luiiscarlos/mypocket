import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { createSupportTicket } from "@/app/dashboard/actions";
import { Modal } from "@/components/app/modal";
import { EmptyState, PageHeader, PageNotice, Section, primaryBtn } from "@/components/app/ui";
import { inputClass, labelClass } from "@/components/forms";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";
import { CATEGORIES, TICKET_FIELDS, TicketCard, type Ticket } from "@/components/app/tickets";


export async function SupportScreen({ base, searchParams }: { base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const PAGE = `${base}/support`;

  const [t, notice, data] = await Promise.all([
    getTranslations("app.support"),
    appNotice(await searchParams),
    gql<{ me: { readOnly: boolean }; supportTickets: Ticket[] }>(`{ me { readOnly } supportTickets { ${TICKET_FIELDS} } }`),
  ]);
  const newTicket = !data.me.readOnly && (
    <Modal title={t("new")} trigger={<><Plus size={16} aria-hidden />{t("new")}</>} triggerClassName={primaryBtn} closeLabel={t("close")}>
      <form action={createSupportTicket} className="flex flex-col gap-4">
        <input type="hidden" name="back" value={PAGE} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
          <label className={labelClass}>
            {t("subject")}
            <input name="subject" required minLength={3} maxLength={120} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t("category")}
            <select name="category" defaultValue="OTHER" className={`${inputClass} px-3`}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          {t("message")}
          <textarea name="message" required minLength={10} maxLength={5000} rows={7} placeholder={t("messageHint")} className={`${inputClass} h-auto resize-y py-3`} />
        </label>
        <button className={`${primaryBtn} self-start`}>{t("send")}</button>
      </form>
    </Modal>
  );

  return (
    <>
      <PageHeader title={t("title")}>{data.supportTickets.length > 0 && newTicket}</PageHeader>
      <PageNotice {...notice} />
      {data.supportTickets.length === 0 ? (
        <EmptyState title={t("empty.title")} text={t("empty.text")} actions={newTicket} />
      ) : (
        <Section title={t("yours")}>
          <ul className="m-0 flex list-none flex-col p-0">
            {data.supportTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
          </ul>
        </Section>
      )}
    </>
  );
}
