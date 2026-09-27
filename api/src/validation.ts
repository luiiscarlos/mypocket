import { z } from "zod";
import { GraphQLError } from "graphql";

const id = z.coerce.number().int().positive();
const amount = z.number().positive().max(9_999_999_999.99).multipleOf(0.01);
const currency = z.string().regex(/^[A-Z]{3}$/, "código ISO 4217 de 3 letras");
const date = z.iso.date();
const note = z.string().trim().max(500).nullable();
const type = z.enum(["income", "expense"]);

const atLeastOneField = (o: object) => Object.keys(o).length > 0;
const optText = (max: number) => z.string().trim().min(1).max(max).nullable();

export const primitives = { id, amount, currency, date, note, type, atLeastOneField, optText };

export const schemas = {
  id,
  month: date,
  transactionFilter: z
    .object({ from: date, to: date, type, categoryId: id, accountId: id })
    .partial()
    .nullish(),
  page: z.object({ limit: z.number().int().min(1).max(100), offset: z.number().int().min(0) }),
  createTransaction: z.object({
    type,
    amount,
    currency: currency.optional(),
    categoryId: id.nullish(),
    accountId: id.nullish(),
    occurredOn: date.optional(),
    note: note.optional(),
  }),
  updateTransaction: z
    .object({ type, amount, currency, categoryId: id.nullable(), accountId: id.nullable(), occurredOn: date, note })
    .partial()
    .refine(atLeastOneField, "no hay campos que actualizar"),
  createCategory: z.object({
    name: z.string().trim().min(1).max(50),
    icon: z.string().trim().max(50).nullish(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "color hex #rrggbb").nullish(),
  }),
  updateCategory: z
    .object({
      name: z.string().trim().min(1).max(50),
      icon: z.string().trim().max(50).nullable(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "color hex #rrggbb").nullable(),
    })
    .partial()
    .refine(atLeastOneField, "no hay campos que actualizar"),
  contactMessage: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.email().max(254),
    topic: z.enum(["support", "bank", "billing", "other"]),
    message: z.string().trim().min(1).max(5000),
    acceptPrivacy: z.literal(true, "debes aceptar la política de privacidad"),
  }),
  updateProfile: z
    .object({
      displayName: z.string().trim().min(1).max(50).nullable(),
      currency,
      fullName: optText(100),
      phone: z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/, "teléfono no válido").nullable(),
      addressLine: optText(200),
      postalCode: optText(20),
      city: optText(100),
      country: z.string().regex(/^[A-Z]{2}$/, "código de país ISO de 2 letras").nullable(),
      birthDate: date.nullable(),
      theme: z.enum(["light", "dark", "system"]),
      locale: z.enum(["es", "en"]),
      notificationsEnabled: z.boolean(),
    })
    .partial()
    .refine(atLeastOneField, "no hay campos que actualizar"),
};

export function parse<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new GraphQLError("Datos no válidos", {
    extensions: {
      code: "BAD_USER_INPUT",
      fields: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    },
  });
}
