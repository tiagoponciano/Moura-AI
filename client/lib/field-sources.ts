/** Who last wrote a field value: an assistant tool, the user in the panel, or a saved project. */
export type FieldSource = "assistant" | "user" | "project";

export type FieldSources = Record<string, FieldSource | undefined>;

export type SourceTag = "IA" | "editado" | "projeto";

/** Returns a copy of `sources` with every field in `names` set to `source`. */
export function recordSources(
  sources: FieldSources,
  names: string[],
  source: FieldSource,
): FieldSources {
  return {
    ...sources,
    ...Object.fromEntries(names.map((name) => [name, source])),
  };
}

/** Tag shown next to a field label; none while the field is empty. */
export function sourceTag(
  source: FieldSource | undefined,
  value: string | number | boolean | undefined,
): SourceTag | undefined {
  const empty =
    value === undefined || (typeof value === "string" && value.trim() === "");
  if (!source || empty) return undefined;
  if (source === "project") return "projeto";
  return source === "assistant" ? "IA" : "editado";
}
