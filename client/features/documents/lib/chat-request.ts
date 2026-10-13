import { z } from "zod";

/** More than any template needs; bounds the prompt a request can build. */
export const MAX_TEMPLATE_FIELDS = 100;

const SLUG = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const FIELD_NAME = /^[a-z][a-z0-9_]{0,63}$/;

const templateField = z.strictObject({
  name: z.string().regex(FIELD_NAME),
  type: z.enum(["string", "number", "date", "boolean"]),
  label: z.string().min(1).max(80),
  description: z.string().max(500),
  required: z.boolean().optional(),
});

/**
 * Body of `POST /api/documents/chat`. The template schema comes from the
 * browser and is written into the system prompt, so names and ids are
 * restricted to identifiers. `messages` is checked by `parseChatMessages`.
 */
export const documentsChatBody = z.object({
  id: z.unknown(),
  messages: z.unknown(),
  templateId: z.string().regex(SLUG),
  schema: z.strictObject({
    fields: z.array(templateField).min(1).max(MAX_TEMPLATE_FIELDS),
  }),
});
