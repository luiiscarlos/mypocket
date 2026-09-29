import { getFormatter, getTranslations } from "next-intl/server";

export type Ticket = {
  id: string; subject: string; category: string; message: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  adminReply: string | null; createdAt: string; updatedAt: string; userEmail?: string | null; userName?: string | null;
};
export const TICKET_FIELDS = "id subject category message status adminReply createdAt updatedAt";
export const CATEGORIES = ["BUG", "ACCOUNT", "BANK", "BILLING", "IDEA", "OTHER"] as const;
export const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

const STATUS_STYLE: Record<Ticket["status"], string> = {
  OPEN: "border-info text-info-ink bg-info-bg",
  IN_PROGRESS: "border-warn text-warn-ink bg-warn-bg",
  RESOLVED: "border-leaf text-ink bg-ok-bg",
  CLOSED: "border-rule text-ink-muted",
};

/** One ticket: header, message and the team's answer; `children` holds admin controls. */
export async function TicketCard({ ticket, children }: { ticket: Ticket; children?: React.ReactNode }) {
  const [t, format] = await Promise.all([getTranslations("app.support"), getFormatter()]);
  const when = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <li className="flex flex-col gap-3 border-b border-rule py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`border px-2 py-0.5 font-mono text-[11px] tracking-[0.06em] ${STATUS_STYLE[ticket.status]}`}>{t(`statuses.${ticket.status}`)}</span>
        <span className="text-base font-semibold">{ticket.subject}</span>
        <span className="font-mono text-xs text-ink-muted">#{ticket.id} · {t(`categories.${ticket.category}` as "categories.BUG")} · {when(ticket.createdAt)}</span>
      </div>
      {ticket.userEmail && <div className="text-[13px] text-ink-muted">{[ticket.userName, ticket.userEmail].filter(Boolean).join(" · ")}</div>}
      <p className="m-0 whitespace-pre-line text-[15px] leading-[1.55]">{ticket.message}</p>
      {ticket.adminReply && (
        <div className="flex flex-col gap-1 border-l-[3px] border-leaf bg-band px-4 py-3">
          <span className="font-mono text-[11px] tracking-[0.06em] text-ink-muted">{t("reply")} · {when(ticket.updatedAt)}</span>
          <p className="m-0 whitespace-pre-line text-[15px]">{ticket.adminReply}</p>
        </div>
      )}
      {children}
    </li>
  );
}
