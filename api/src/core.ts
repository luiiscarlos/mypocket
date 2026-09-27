import { GraphQLError, GraphQLScalarType } from "graphql";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  display_name: string | null;
  currency: string;
  account_type: "real" | "demo";
  read_only: boolean;
  full_name: string | null;
  phone: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  birth_date: string | null;
  plan: "free" | "pro";
  theme: "light" | "dark" | "system";
  locale: "es" | "en";
  notifications_enabled: boolean;
  onboarding_completed_at: string | null;
  is_admin: boolean;
};

export type AuthedUser = {
  userId: string;
  email: string | null;
  token: string;
  /** Supabase client that runs as the user, so Postgres RLS applies to every query. */
  db: SupabaseClient;
  profile?: Promise<Profile>;
};

export type Context = {
  user: AuthedUser | null;
  /** Secret-key client (account deletion, plan changes, shared caches). Null when SUPABASE_SECRET_KEY is not set. */
  admin: SupabaseClient | null;
  ownerUserId: string | null;
  /** Client IP forwarded by the BFF (trusted only after the internal-secret check). */
  clientIp: string;
};

export const PROFILE_COLUMNS =
  "id, display_name, currency, account_type, read_only, full_name, phone, address_line, postal_code, city, country, birth_date, plan, theme, locale, notifications_enabled, onboarding_completed_at, is_admin";

export const clientError = (message: string, code: string) => new GraphQLError(message, { extensions: { code } });

// Never return Postgres messages to the client: they leak table and constraint names.
export function fail(error: PostgrestError): never {
  switch (error.code) {
    case "PGRST116":
      throw clientError("No encontrado", "NOT_FOUND");
    case "42501":
      throw clientError("No tienes permiso para esta operación", "FORBIDDEN");
    case "23505":
      throw clientError("Ya existe un elemento con esos datos", "CONFLICT");
    case "23502":
    case "23503":
    case "23514":
    case "22P02":
    case "22007":
    case "22008":
      console.warn("rejected by database constraint:", error.code, error.message);
      throw clientError("Datos no válidos", "BAD_USER_INPUT");
    default:
      throw new Error(`${error.code}: ${error.message}`); // masked by Yoga, logged server-side
  }
}

export function requireUser(ctx: Context): AuthedUser {
  if (!ctx.user) throw clientError("Inicia sesión para continuar", "UNAUTHENTICATED");
  return ctx.user;
}

export function profileOf(user: AuthedUser): Promise<Profile> {
  user.profile ??= (async () => {
    const { data, error } = await user.db
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.userId)
      .single<Profile>();
    if (error) fail(error);
    return data;
  })();
  return user.profile;
}

export async function requireWritable(ctx: Context): Promise<AuthedUser> {
  const user = requireUser(ctx);
  if ((await profileOf(user)).read_only) {
    throw clientError("La cuenta demo es de solo lectura", "FORBIDDEN");
  }
  return user;
}

export function requireAdmin(ctx: Context) {
  if (!ctx.admin) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return ctx.admin;
}

/** Throws BAD_USER_INPUT unless `id` is a row of `table` owned by the user (null/undefined passes). */
export async function assertOwned(user: AuthedUser, table: "categories" | "accounts", id: number | null | undefined) {
  if (id == null) return;
  const { data, error } = await user.db.from(table).select("id").eq("id", id).eq("user_id", user.userId).maybeSingle();
  if (error) fail(error);
  if (!data) throw clientError(table === "accounts" ? "Cuenta no encontrada" : "Categoría no encontrada", "BAD_USER_INPUT");
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** camelCase input keys → snake_case columns; keys absent from the map are dropped. */
export const toColumns = (input: Record<string, unknown>, map: Record<string, string>) =>
  Object.fromEntries(Object.entries(input).filter(([k]) => k in map).map(([k, v]) => [map[k], v]));

/** Opaque JSON object scalar; every resolver that accepts it validates it with Zod. */
export const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  serialize: (value) => value,
  parseValue: (value) => value,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Resolver = (parent: unknown, args: any, ctx: Context) => unknown;
/** A module's resolvers; `ctx` is typed as Context in every Query/Mutation resolver. */
export type ResolverMap = {
  Query?: Record<string, Resolver>;
  Mutation?: Record<string, Resolver>;
  [typeName: string]: unknown;
};
export type Module = { typeDefs: string; resolvers: ResolverMap };

export async function toMe(ctx: Context, user: AuthedUser) {
  const p = await profileOf(user);
  return {
    id: p.id,
    email: user.email,
    displayName: p.display_name,
    currency: p.currency,
    accountType: p.account_type,
    isOwner: p.account_type === "real" && ctx.ownerUserId === p.id,
    readOnly: p.read_only,
    fullName: p.full_name,
    phone: p.phone,
    addressLine: p.address_line,
    postalCode: p.postal_code,
    city: p.city,
    country: p.country,
    birthDate: p.birth_date,
    plan: p.plan,
    theme: p.theme,
    locale: p.locale,
    notificationsEnabled: p.notifications_enabled,
    onboardingCompleted: p.onboarding_completed_at !== null,
    isAdmin: p.is_admin,
  };
}
