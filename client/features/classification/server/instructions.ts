import type { Facts } from "../lib/engine/types";
import type { OccupationPart } from "../lib/mixed-occupancy";
import { classifyWithParts } from "../lib/mixed-parts";
import {
  QUESTIONS,
  RECORD_ANSWERS_TOOL,
  RECORD_PARTS_TOOL,
  SEARCH_ACTIVITY_TOOL,
  questionFor,
} from "../lib/questions";

function describeAnswers(state: Facts): string {
  const lines = Object.entries(state)
    .filter(([fact]) => questionFor(fact))
    .map(([fact, value]) => `- ${fact}: ${value === null ? "não sei" : value}`);
  return lines.length ? lines.join("\n") : "none yet";
}

function describeParts(parts: OccupationPart[]): string {
  return parts.length
    ? parts
        .map(
          (p) =>
            `- ${p.division}: ${p.area_m2} m2, last floor at ${p.top_height_m} m, ${p.storeys} storeys, ${p.separation}${p.fire_load_class ? `, fire load ${p.fire_load_class}` : ""}`,
        )
        .join("\n")
    : "none yet";
}

/**
 * System prompt for the classification assistant. It carries the answers the
 * panel already holds and the next question, so the model never re-asks and
 * needs no norm text: the engine decides, the model only records and asks.
 */
export function buildInstructions(
  state: Facts,
  analysisDate: string,
  parts: OccupationPart[] = [],
): string {
  const facts = QUESTIONS.map((q) => `- ${q.fact}: ${q.description}`).join(
    "\n",
  );
  const next = classifyWithParts(state, parts, analysisDate).next;
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

Occupations already recorded (only when the property mixes several uses):
${describeParts(parts)}

Next question to ask: ${next ? `"${next.ask}"` : "none, every answer needed so far is in"}

Rules:
1. NEVER invent or estimate data. Do not derive the height from the number of storeys or the reverse.
2. Whenever the conversation brings new or corrected answers, call the \`${RECORD_ANSWERS_TOOL}\` tool with only those. If the user says they do not know something, list that fact in \`unknown\` instead of guessing.
3. To identify the activity, call \`${SEARCH_ACTIVITY_TOOL}\` with the user's own words. Show the options and ask which one is theirs, even when only one matches; never pick for them and never invent an id. When they confirm, record its id as \`activity\`: that sets the division and, when the norm gives it, the fire load, so do not ask for those. If nothing matches, say the activity is not listed in the norm and record the division as "other".
4. Ask one question at a time, using the wording above or the \`next\` field of the tool result. Do not ask for anything already recorded. When that question lists several points and the user simply confirms ("sim"), record all of them as true of the building: ${confirmations}. If the user denies one, record it and ask about the others.
5. Do NOT say which systems are required, cite norms or tables, or explain why: the side panel shows the result with its sources. If the tool result has status "analysis", say this case needs a specific analysis and point to the panel.
6. When the user says the property mixes several uses and they are not all subsidiary, record that with \`single_use\` false, then collect every occupation (division, area, height of its last floor, storeys, and whether it is isolated, compartmented or open) and call \`${RECORD_PARTS_TOOL}\` with the whole list, predominant first. Each call replaces the previous list, so never send only the new one. Never invent areas or heights.
7. Always reply in Brazilian Portuguese, briefly. After recording, say what was recorded.`;
}
