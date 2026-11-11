import { z } from "zod";
import {
  ANSWER_STATUSES,
  answerKey,
  type Answer,
  type AnswerStatus,
  type ChecklistGroup,
} from "./ppci-answers";

/** Tool the agent calls to answer items of the current group. */
export const MARK_ITEMS_TOOL = "mark_items";
/** Tool the agent calls when the user says the whole group does not apply to the project. */
export const GROUP_NOT_APPLICABLE_TOOL = "mark_group_not_applicable";

export const markItemsInput = z.object({
  items: z
    .array(
      z.object({
        position: z.number().int().describe("Number of the item in the group"),
        status: z.enum(ANSWER_STATUSES),
        note: z.string().max(2000).optional(),
      }),
    )
    .max(100),
});

/** Body of `POST /api/documents/ppci-chat`; `messages` is checked by `parseChatMessages`. */
export const ppciChatBody = z.object({
  id: z.unknown(),
  messages: z.unknown(),
  projectId: z.uuid(),
  groupPosition: z.number().int().min(1).max(100),
});

/** Items of a group with no answer yet. */
export function unansweredItems(
  group: ChecklistGroup,
  answers: Map<string, Answer>,
) {
  return group.items.filter(
    (item) => !answers.get(answerKey(group.position, item.position))?.status,
  );
}

/** The group the conversation is on: the one picked, else the first with unanswered items, else the last. */
export function currentGroup(
  groups: ChecklistGroup[],
  answers: Map<string, Answer>,
  picked?: number,
): ChecklistGroup | undefined {
  return (
    groups.find((group) => group.position === picked) ??
    groups.find((group) => unansweredItems(group, answers).length > 0) ??
    groups.at(-1)
  );
}

export type AnswerChange = {
  itemPosition: number;
  status: AnswerStatus;
  note?: string;
};

/**
 * The answers a tool call of the agent stands for. Items that are not in the
 * group are dropped; marking the whole group not applicable only touches items
 * with no answer yet.
 */
export function changesFromToolOutput(
  toolName: string,
  output: unknown,
  group: ChecklistGroup,
  answers: Map<string, Answer>,
): AnswerChange[] {
  if (toolName === GROUP_NOT_APPLICABLE_TOOL) {
    return unansweredItems(group, answers).map((item) => ({
      itemPosition: item.position,
      status: "na" as const,
    }));
  }
  if (toolName !== MARK_ITEMS_TOOL) return [];
  const parsed = markItemsInput.safeParse(output);
  if (!parsed.success) return [];
  const known = new Set(group.items.map((item) => item.position));
  return parsed.data.items
    .filter((item) => known.has(item.position))
    .map(({ position, status, note }) => ({
      itemPosition: position,
      status,
      ...(note?.trim() && { note: note.trim() }),
    }));
}

/** What the chat says before the first message (UI copy). */
export function ppciChatEmptyState(group?: ChecklistGroup): string {
  return group
    ? `Vou passar pelo grupo "${group.name}" com você. Diga o que o projeto atende, o que precisa ser adequado e o que não se aplica.`
    : "Todos os grupos já foram respondidos.";
}
