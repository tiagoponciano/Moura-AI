import { z } from "zod";
import { LLM_PROVIDERS, isCatalogModel } from "@/lib/llm/catalog";

export const providerSchema = z.enum(LLM_PROVIDERS);

/** Body of `PATCH /api/admin/users/:id`. */
export const userUpdateSchema = z
  .strictObject({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    role: z.enum(["admin", "member"]).optional(),
  })
  .refine((body) => body.status || body.role, {
    message: "Send status, role or both",
  });

const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** Accepts "Moura.com", "@moura.com" or ""; empty means every domain. */
export const domainSchema = z
  .string()
  .transform((value) => value.trim().replace(/^@/, "").toLowerCase())
  .refine((value) => value === "" || DOMAIN_PATTERN.test(value), {
    message: "Invalid domain",
  })
  .transform((value) => value || null);

/** Body of `PUT /api/admin/settings`. */
export const settingsUpdateSchema = z
  .strictObject({
    llm: z
      .strictObject({ provider: providerSchema, model: z.string() })
      .refine(({ provider, model }) => isCatalogModel(provider, model), {
        message: "Model is not in the catalog for this provider",
      })
      .optional(),
    allowedEmailDomain: domainSchema.nullable().optional(),
  })
  .refine(
    (body) => body.llm !== undefined || body.allowedEmailDomain !== undefined,
    { message: "Send llm, allowedEmailDomain or both" },
  );

/** Body of `PUT /api/admin/settings/keys/:provider`. */
export const providerKeySchema = z.strictObject({
  key: z.string().trim().min(1).max(500),
});

/** Body of `POST /api/admin/forms/resolve`. */
export const formLinkSchema = z.strictObject({
  url: z.string().trim().min(1, "Cole um link").max(2000),
});

/** One form to save; messages are shown in the import table. */
export const formDraftSchema = z.strictObject({
  googleDocId: z.string().regex(/^[\w-]{20,}$/, "Link do Google Docs inválido"),
  normative: z
    .number({ error: "Informe o número da IN" })
    .int("Informe o número da IN")
    .positive("Informe o número da IN")
    .max(999, "Informe o número da IN"),
  annex: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{1,2}$/, "O anexo deve ter uma ou duas letras"),
  name: z.string().trim().min(1, "Informe o nome").max(200, "Nome muito longo"),
});

export type FormDraftInput = z.infer<typeof formDraftSchema>;

/** Body of `POST /api/admin/forms`. */
export const formsSaveSchema = z.strictObject({
  forms: z.array(formDraftSchema).min(1).max(50),
});

/** Body of `PATCH /api/admin/forms/:docId`: any of a form's fields. */
export const formUpdateSchema = formDraftSchema
  .partial()
  .extend({ active: z.boolean().optional() })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Send at least one field",
  });

export type FormChange = z.infer<typeof formUpdateSchema>;
