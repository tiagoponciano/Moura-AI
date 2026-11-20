import {
  sourceTag,
  type FieldSources,
  type SourceTag,
} from "@/lib/field-sources";
import { isEmptyValue } from "./form-values";
import type { FieldValue, FieldValues, TemplateField } from "./templates";

export type ReviewItem = {
  name: string;
  label: string;
  /** The value as the document will print it. */
  text: string;
  tag?: SourceTag;
};

export type ReviewSummary = {
  /** What the document will carry, in the order of the form. */
  filled: ReviewItem[];
  /** Labels of the required fields still empty. */
  missingRequired: string[];
};

const printed = (value: FieldValue): string =>
  typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value);

/**
 * What a person reviews before the document is made: each filled field with where
 * its value came from, and the required fields that are still empty. A switch left
 * off counts as an answer ("Não"), as it does in the form.
 */
export function reviewSummary(
  fields: TemplateField[],
  values: FieldValues,
  sources: FieldSources,
): ReviewSummary {
  const filled: ReviewItem[] = [];
  const missingRequired: string[] = [];
  for (const field of fields) {
    // A switch nobody touched prints "Não", as when the document is made.
    const value =
      field.type === "boolean"
        ? (values[field.name] ?? false)
        : values[field.name];
    if (!isEmptyValue(value) && value !== undefined) {
      // A marked option that is off prints nothing.
      if (field.type === "boolean" && value === false && field.mark) continue;
      filled.push({
        name: field.name,
        label: field.label,
        text: printed(value),
        tag: sourceTag(sources[field.name], value),
      });
    } else if (field.required) {
      missingRequired.push(field.label);
    }
  }
  return { filled, missingRequired };
}
