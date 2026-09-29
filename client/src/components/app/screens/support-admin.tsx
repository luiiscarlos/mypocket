import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { answerSupportTicket } from "@/app/dashboard/actions";
import { Empty, ListControls, PageHeader, PageNotice, pick, secondaryBtn } from "@/components/app/ui";
import { Label, NativeSelect, NativeSelectOption, Textarea, labelClass, selectClass, textareaClass } from "@/components/forms";
import { gql } from "@/lib/api";
import { appNotice } from "@/lib/auth-codes";
import { STATUSES, TICKET_FIELDS, TicketCard, type Ticket } from "@/components/app/tickets";


/** Admins only: the page 404s for everyone else and the API enforces the role again. */
export async function SupportAdminScreen({ base, searchParams }: { base: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const PAGE = `${base}/support/admin`;

  const sp = await searchParams;
  const { me } = await gql<{ me: { isAdmin: boolean } }>("{ me { isAdmin } }");
  if (!me.isAdmin) notFound();

  const status = pick(sp.status, STATUSES);
  const back = status ? `${PAGE}?status=${status}` : PAGE;
  const [t, notice, { adminSupportTickets: tickets }] = await Promise.all([
    getTranslations("app.support"),
    appNotice(sp as { error?: string; message?: string }),
    gql<{ adminSupportTickets: Ticket[] }>(`query ($s: TicketStatus) { adminSupportTickets(status: $s) { ${TICKET_FIELDS} userEmail userName } }`, { s: status ?? null }),
  ]);

  return (
    <>
      <PageHeader title={t("adminTitle")} meta={t("count", { count: tickets.length })} />
      <PageNotice {...notice} />
      <ListControls
        action={PAGE}
        apply={t("filters.apply")}
        reset={t("filters.reset")}
        controls={[{ name: "status", label: t("filters.status"), value: status, options: [{ value: "", label: t("filters.all") }, ...STATUSES.map((s) => ({ value: s, label: t(`statuses.${s}`) }))] }]}
      />
      {tickets.length === 0 ? (
        <Empty>{t("adminEmpty")}</Empty>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket}>
              <details>
                <summary className="cursor-pointer text-sm font-semibold underline">{t("answer")}</summary>
                <form action={answerSupportTicket} className="mt-3 flex flex-col gap-3">
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="id" value={ticket.id} />
                  <Label className={labelClass}>
                    {t("reply")}
                    <Textarea name="reply" rows={4} maxLength={5000} defaultValue={ticket.adminReply ?? ""} className={textareaClass} />
                  </Label>
                  <div className="flex flex-wrap items-end gap-3">
                    <Label className={labelClass}>
                      {t("filters.status")}
                      <NativeSelect name="status" defaultValue={ticket.status} className={`${selectClass} w-56 px-3`}>
                        {STATUSES.map((s) => <NativeSelectOption key={s} value={s}>{t(`statuses.${s}`)}</NativeSelectOption>)}
                      </NativeSelect>
                    </Label>
                    <button className={`${secondaryBtn} h-[52px]`}>{t("saveAnswer")}</button>
                  </div>
                </form>
              </details>
            </TicketCard>
          ))}
        </ul>
      )}
    </>
  );
}
