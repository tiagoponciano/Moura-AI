/** Who last wrote a field value: an assistant tool or the user in the panel. */
export type FieldSource = "assistant" | "user";

export type FieldSources = Record<string, FieldSource | undefined>;

export type SourceTag = "IA" | "editado";

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
  return source === "assistant" ? "IA" : "editado";
}
