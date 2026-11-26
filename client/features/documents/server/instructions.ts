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

/** What the assistant is told about the tools another module added, numbered after the base rules. */
function extraRules(extraTools: string[]): string {
  const rules = [
    extraTools.includes("check_building")
      ? "When the user states data about the building (occupation division, area, height, storeys, people, special risks or the risk level), call `check_building` with it. The tool applies the norms; you decide nothing about them. If it returns conflicts, tell the user plainly what the norm gives, cite its source and ask which is right before recording the conflicting value. If it returns missing items, you may ask for them when they help the form. Never state a risk level the tool did not return."
      : undefined,
    extraTools.includes("search_norm")
      ? "When the user asks what a norm requires, or you need a norm to answer, call `search_norm` and answer from what it returns (put synonyms and other words the norm may use in `also`), citing the instruction, the article and the page (an annex page has no article number: cite the annex and the page). When an excerpt is not enough, call `read_norm_text` for the whole article or annex page. If it finds nothing, say so. Never quote a norm from memory. When the user says a norm you cited does not match, search again with other words and `also` synonyms before answering again."
      : undefined,
  ].filter((rule): rule is string => rule !== undefined);
  return rules.map((rule, index) => `\n${8 + index}. ${rule}`).join("");
}

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
  extraTools: string[] = [],
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
7. Always reply in Brazilian Portuguese, briefly and objectively. After filling, say what was recorded and which required fields are still missing. When the reply leaves no required field missing, end it with the question "Está certo? Posso gerar?"; do not ask it before then, so the conversation is not interrupted.${extraRules(extraTools)}`;
}
