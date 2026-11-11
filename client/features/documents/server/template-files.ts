import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConversationGuide } from "../lib/conversation-steps";
import type { TemplateEntry, TemplateSchema } from "../lib/templates";

const PUBLIC = join(process.cwd(), "public");

const readPublic = (path: string) => readFile(join(PUBLIC, path));

async function loadIndexEntry(id: string) {
  const index = JSON.parse(
    (await readPublic("templates/index.json")).toString(),
  ) as TemplateEntry[];
  return index.find((template) => template.id === id);
}

/** Server-only. A template's hand-written conversation guide, if it has one. */
export async function loadTemplateGuide(
  id: string,
): Promise<ConversationGuide | undefined> {
  const entry = await loadIndexEntry(id);
  if (!entry?.guide) return undefined;
  return JSON.parse((await readPublic(entry.guide)).toString());
}

/**
 * Server-only. A template's entry, schema and file. The id is only compared to
 * `index.json`, and the paths come from that file, never from the request.
 */
export async function loadTemplateFiles(id: string) {
  const entry = await loadIndexEntry(id);
  if (!entry) return undefined;

  const [schema, docx] = await Promise.all([
    readPublic(entry.schema),
    readPublic(entry.file),
  ]);
  return {
    entry,
    schema: JSON.parse(schema.toString()) as TemplateSchema,
    docx,
  };
}
