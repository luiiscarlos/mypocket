import { fail, requireUser, type Module } from "../core.js";

const typeDefs = /* GraphQL */ `
  type AppUpdate {
    version: String!
    "YYYY-MM-DD"
    publishedAt: String!
    title: String!
    body: String!
  }

  extend type Query {
    "Release notes, newest first, in the requested language."
    appUpdates(locale: Locale!): [AppUpdate!]!
  }
`;

type Row = { version: string; published_at: string; title_es: string; body_es: string; title_en: string; body_en: string };

export const updates: Module = {
  typeDefs,
  resolvers: {
    Locale: { ES: "es", EN: "en" },

    Query: {
      appUpdates: async (_, args: { locale: "es" | "en" }, ctx) => {
        const user = requireUser(ctx);
        const { data, error } = await user.db
          .from("app_updates")
          .select("version, published_at, title_es, body_es, title_en, body_en")
          .order("published_at", { ascending: false });
        if (error) fail(error);
        const en = args.locale === "en";
        return (data as Row[]).map((r) => ({
          version: r.version,
          publishedAt: r.published_at,
          title: en ? r.title_en : r.title_es,
          body: en ? r.body_en : r.body_es,
        }));
      },
    },
  },
};
