import { z } from "zod";

/** Body of `POST /api/documents/generate`. Field names are checked against the schema. */
export const generateRequestBody = z.strictObject({
  templateId: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  format: z.enum(["pdf", "docx"]),
  values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export type DocumentFormat = z.infer<typeof generateRequestBody>["format"];
