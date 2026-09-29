import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { createSupportTicket } from "@/app/dashboard/actions";
import { Modal } from "@/components/app/modal";
import { EmptyState, PageHeader, PageNotice, Section, primaryBtn } from "@/components/app/ui";
import { Input, Label, NativeSelect, NativeSelectOption, Textarea, inputClass, labelClass, selectClass, textareaClass } from "@/components/forms";
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
          <Label className={labelClass}>
            {t("subject")}
            <Input name="subject" required minLength={3} maxLength={120} className={inputClass} />
          </Label>
          <Label className={labelClass}>
            {t("category")}
            <NativeSelect name="category" defaultValue="OTHER" className={selectClass}>
              {CATEGORIES.map((c) => <NativeSelectOption key={c} value={c}>{t(`categories.${c}`)}</NativeSelectOption>)}
            </NativeSelect>
          </Label>
        </div>
        <Label className={labelClass}>
          {t("message")}
          <Textarea name="message" required minLength={10} maxLength={5000} rows={7} placeholder={t("messageHint")} className={textareaClass} />
        </Label>
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
