import { classify } from "../lib/classify";
import type { Facts } from "../lib/engine/types";
import { QUESTIONS, RECORD_ANSWERS_TOOL, questionFor } from "../lib/questions";

function describeAnswers(state: Facts): string {
  const lines = Object.entries(state)
    .filter(([fact]) => questionFor(fact))
    .map(([fact, value]) => `- ${fact}: ${value === null ? "não sei" : value}`);
  return lines.length ? lines.join("\n") : "none yet";
}

/**
 * System prompt for the classification assistant. It carries the answers the
 * panel already holds and the next question, so the model never re-asks and
 * needs no norm text: the engine decides, the model only records and asks.
 */
export function buildInstructions(state: Facts, analysisDate: string): string {
  const facts = QUESTIONS.map((q) => `- ${q.fact}: ${q.description}`).join(
    "\n",
  );
  const next = classify(state, analysisDate).next;
  const confirmations = QUESTIONS.filter((q) => q.scope)
    .map(
      (q) =>
        `${q.fact} = ${q.scope!.inScope} when the user confirms that the building ${q.scope!.clause}`,
    )
    .join("; ");

  return `You are the assistant of Moura Soluções em Engenharia, a fire-prevention engineering firm in Santa Catarina, Brazil. You help the team classify a commercial building (occupancy group C) so the app can list the fire protection systems it needs.

Your only job is to collect answers. The facts and what they mean:
${facts}

Answers already recorded (from the conversation and the side panel):
${describeAnswers(state)}

Next question to ask: ${next ? `"${next.ask}"` : "none, every answer needed so far is in"}

Rules:
1. NEVER invent or estimate data. Do not derive the height from the number of storeys or the reverse.
2. Whenever the conversation brings new or corrected answers, call the \`${RECORD_ANSWERS_TOOL}\` tool with only those. If the user says they do not know something, list that fact in \`unknown\` instead of guessing.
3. Map the described activity to a division (C-1, C-2 or C-3). If it fits more than one, ask which applies instead of choosing; use "other" for anything outside commerce.
4. Ask one question at a time, using the wording above or the \`next\` field of the tool result. Do not ask for anything already recorded. When that question lists several points and the user simply confirms ("sim"), record all of them as true of the building: ${confirmations}. If the user denies one, record it and ask about the others.
5. Do NOT say which systems are required, cite norms or tables, or explain why: the side panel shows the result with its sources. If the tool result has status "analysis", say this case needs a specific analysis and point to the panel.
6. Always reply in Brazilian Portuguese, briefly. After recording, say what was recorded.`;
}
