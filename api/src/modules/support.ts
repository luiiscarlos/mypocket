import { z } from "zod";
import { clientError, fail, profileOf, requireAdmin, requireUser, requireWritable, type AuthedUser, type Context, type Module } from "../core.js";
import { parse, primitives as p } from "../validation.js";

const typeDefs = /* GraphQL */ `
  enum TicketCategory { BUG ACCOUNT BANK BILLING IDEA OTHER }
  enum TicketStatus { OPEN IN_PROGRESS RESOLVED CLOSED }

  type SupportTicket {
    id: ID!
    subject: String!
    category: TicketCategory!
    message: String!
    status: TicketStatus!
    "Answer from the support team, shown to the user."
    adminReply: String
    createdAt: String!
    updatedAt: String!
    "Admin listing only: who opened it."
    userEmail: String
    userName: String
  }

  input SupportTicketInput {
    subject: String!
    category: TicketCategory!
    message: String!
  }

  extend type Query {
    "Your own tickets, newest first."
    supportTickets: [SupportTicket!]!
    "Admins only: every ticket, optionally by status, newest first."
    adminSupportTickets(status: TicketStatus): [SupportTicket!]!
  }

  extend type Mutation {
    createSupportTicket(input: SupportTicketInput!): SupportTicket!
    "Admins only: change the status and/or answer a ticket."
    answerSupportTicket(id: ID!, status: TicketStatus!, reply: String): SupportTicket!
  }
`;

type TicketRow = {
  id: number; user_id: string; subject: string; category: string; message: string; status: string;
  admin_reply: string | null; created_at: string; updated_at: string;
};

const COLUMNS = "id, user_id, subject, category, message, status, admin_reply, created_at, updated_at";
const CATEGORIES = ["bug", "account", "bank", "billing", "idea", "other"] as const;
const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

const schemas = {
  create: z.object({
    subject: z.string().trim().min(3).max(120),
    category: z.enum(CATEGORIES),
    message: z.string().trim().min(10).max(5000),
  }),
  answer: z.object({ id: p.id, status: z.enum(STATUSES), reply: z.string().trim().max(5000).nullish() }),
  status: z.enum(STATUSES).nullish(),
};

const toTicket = (t: TicketRow, who?: { email?: string | null; name?: string | null }) => ({
  id: t.id, subject: t.subject, category: t.category, message: t.message, status: t.status, adminReply: t.admin_reply,
  createdAt: t.created_at, updatedAt: t.updated_at, userEmail: who?.email ?? null, userName: who?.name ?? null,
});

/** Admin gate: the flag lives in the profile and is never writable from the client. */
async function requireSupportAdmin(ctx: Context): Promise<AuthedUser> {
  const user = requireUser(ctx);
  if (!(await profileOf(user)).is_admin) throw clientError("Solo para administradores", "FORBIDDEN");
  return user;
}

export const support: Module = {
  typeDefs,
  resolvers: {
    TicketCategory: { BUG: "bug", ACCOUNT: "account", BANK: "bank", BILLING: "billing", IDEA: "idea", OTHER: "other" },
    TicketStatus: { OPEN: "open", IN_PROGRESS: "in_progress", RESOLVED: "resolved", CLOSED: "closed" },

    Query: {
      supportTickets: async (_, __, ctx) => {
        const user = requireUser(ctx);
        const { data, error } = await user.db.from("support_tickets").select(COLUMNS).eq("user_id", user.userId).order("created_at", { ascending: false });
        if (error) fail(error);
        return (data as TicketRow[]).map((t) => toTicket(t));
      },

      adminSupportTickets: async (_, args: { status?: string | null }, ctx) => {
        await requireSupportAdmin(ctx);
        const status = parse(schemas.status, args.status);
        const admin = requireAdmin(ctx);
        let query = admin.from("support_tickets").select(COLUMNS).order("created_at", { ascending: false }).limit(200);
        if (status) query = query.eq("status", status);
        const { data, error } = await query;
        if (error) fail(error);
        const rows = data as TicketRow[];
        // Who opened each ticket: profile name + auth email (few distinct users per page).
        const ids = [...new Set(rows.map((r) => r.user_id))];
        const { data: profiles } = await admin.from("profiles").select("id, full_name, display_name").in("id", ids);
        const emails = new Map<string, string | null>();
        await Promise.all(ids.map(async (id) => emails.set(id, (await admin.auth.admin.getUserById(id)).data.user?.email ?? null)));
        const names = new Map((profiles ?? []).map((p) => [p.id as string, (p.full_name ?? p.display_name) as string | null]));
        return rows.map((t) => toTicket(t, { email: emails.get(t.user_id), name: names.get(t.user_id) }));
      },
    },

    Mutation: {
      createSupportTicket: async (_, args: { input: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const input = parse(schemas.create, args.input);
        const { data, error } = await user.db.from("support_tickets").insert(input).select(COLUMNS).single<TicketRow>();
        if (error) fail(error);
        return toTicket(data);
      },

      answerSupportTicket: async (_, args: unknown, ctx) => {
        await requireSupportAdmin(ctx);
        const { id, status, reply } = parse(schemas.answer, args);
        const row: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
        if (reply !== undefined) row.admin_reply = reply || null;
        const { data, error } = await requireAdmin(ctx).from("support_tickets").update(row).eq("id", id).select(COLUMNS).maybeSingle<TicketRow>();
        if (error) fail(error);
        if (!data) throw clientError("No encontrado", "NOT_FOUND");
        return toTicket(data);
      },
    },
  },
};
