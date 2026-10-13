import { z } from "zod";
import { LLM_PROVIDERS, isCatalogModel } from "@/lib/llm/catalog";
import type { AdminUser } from "./types";

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

const STATUS_ORDER: Record<AdminUser["status"], number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
};

/** Pending first, then approved, then rejected; newest first within each. */
export function sortUsers(users: AdminUser[]): AdminUser[] {
  return [...users].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}
