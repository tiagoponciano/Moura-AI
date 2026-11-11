import { z } from "zod";
import { requestJson } from "@/lib/api/request-json";
import { MAX_TEMPLATE_FIELDS } from "./chat-request";
import type { FieldValues } from "./templates";

export const TEMPLATE_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/** Body of `PUT /api/documents/projects/:id/fillings/:templateId`. */
export const fillingBody = z.strictObject({
  values: z
    .record(
      z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
      z.union([z.string().max(5000), z.number(), z.boolean()]),
    )
    .refine((values) => Object.keys(values).length <= MAX_TEMPLATE_FIELDS),
});

export const templateIdSchema = z.string().regex(TEMPLATE_ID);

export type Filling = {
  template_id: string;
  values: FieldValues;
  updated_at: string;
};

export const fetchFillings = (projectId: string) =>
  requestJson<{ fillings: Filling[] }>(
    `/api/documents/projects/${projectId}/fillings`,
  );

export const saveFilling = (
  projectId: string,
  templateId: string,
  values: FieldValues,
) =>
  requestJson<void>(
    `/api/documents/projects/${projectId}/fillings/${templateId}`,
    { method: "PUT", body: JSON.stringify({ values: definedValues(values) }) },
  );

/** Drops the unset entries, which JSON would turn into nothing anyway. */
export function definedValues(values: FieldValues) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}
