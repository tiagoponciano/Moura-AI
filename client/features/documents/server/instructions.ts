import {
  type ConversationStep,
  SKIP_STEP_FIELD,
  type StepProgress,
} from "../lib/conversation-steps";
import {
  FILL_FIELDS_TOOL,
  type FieldValues,
  type TemplateSchema,
} from "../lib/templates";

const fieldNames = (schema: TemplateSchema, step: ConversationStep) =>
  schema.fields
    .filter((field) => step.fields.includes(field.name))
    .map((field) => field.name)
    .join(", ");

/** System prompt for the documents assistant: the current step's fields plus extraction rules. */
export function buildInstructions(
  templateId: string,
  schema: TemplateSchema,
  values: FieldValues = {},
  progress: StepProgress = { index: 0, total: 0 },
): string {
  const { step } = progress;
  const fields = schema.fields
    .filter((field) => step?.fields.includes(field.name))
    .map(
      (field) =>
        `- ${field.name} (${field.type}${field.required ? ", required" : ""}): ${field.description}`,
    )
    .join("\n");

  const filled = schema.fields
    .filter((field) => values[field.name] !== undefined)
    .map((field) => `- ${field.name}: ${JSON.stringify(values[field.name])}`)
    .join("\n");

  return `You are the assistant of Moura Soluções em Engenharia, a fire-prevention engineering firm in Santa Catarina, Brazil. You help the team fill in CBMSC (Corpo de Bombeiros Militar de Santa Catarina) forms from the conversation.

Current form: "${templateId}". You lead the conversation one step at a time; the system decides which step comes next.
${
  step
    ? `Current step (${progress.index + 1} of ${progress.total}). Ask only about these fields:
${fields}${step.question ? `\nSuggested question: ${step.question}` : ""}
Once this step is answered or skipped, move on to: ${progress.next ? (progress.next.question ?? fieldNames(schema, progress.next)) : "a review of the side panel"}.`
    : "Every step is answered. Ask the user to review the fields in the side panel."
}

Already filled (do not ask for these again; change one only if the user corrects it):
${filled || "- none"}

Rules:
1. NEVER invent data. Use only information the user stated explicitly.
2. If information is missing, ask for it. A field that was not given stays empty — do not send it in the tool call. If the user volunteers data for another field of the form, record it too.
3. Whenever the conversation brings new or corrected data, call the \`${FILL_FIELDS_TOOL}\` tool with only those fields.
4. Number fields are plain numbers without units. Dates use the DD/MM/AAAA format.
5. You do not generate the document: the system generates the PDF by itself once the required fields are complete, and the user can review the fields in the side panel. Never claim you wrote or changed the document.
6. If the user says the current step does not apply or they do not have the information, call the tool with \`${SKIP_STEP_FIELD}\`: true.
7. Always reply in Brazilian Portuguese, briefly and objectively. After filling, say what was recorded and which required fields are still missing.`;
}
