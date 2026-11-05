import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { TemplateEntry, TemplateSchema } from "../lib/templates";

const PUBLIC = join(process.cwd(), "public");

const readPublic = (path: string) => readFile(join(PUBLIC, path));

/**
 * Server-only. A template's entry, schema and file. The id is only compared to
 * `index.json`, and the paths come from that file, never from the request.
 */
export async function loadTemplateFiles(id: string) {
  const index = JSON.parse(
    (await readPublic("templates/index.json")).toString(),
  ) as TemplateEntry[];
  const entry = index.find((template) => template.id === id);
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
