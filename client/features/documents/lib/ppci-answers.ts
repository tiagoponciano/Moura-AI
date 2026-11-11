import { z } from "zod";
import { requestJson } from "@/lib/api/request-json";

export const ANSWER_STATUSES = ["atende", "adequar", "na"] as const;
export type AnswerStatus = (typeof ANSWER_STATUSES)[number];

export const ANSWER_LABEL: Record<AnswerStatus, string> = {
  atende: "Atende",
  adequar: "Adequar",
  na: "Não se aplica",
};

export type ChecklistItem = {
  position: number;
  section: string | null;
  text: string;
  reference: string | null;
};

export type ChecklistGroup = {
  position: number;
  name: string;
  items: ChecklistItem[];
};

export type Answer = {
  group_position: number;
  item_position: number;
  status: AnswerStatus | null;
  note: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

export type ChecklistResponse = {
  version: string;
  groups: ChecklistGroup[];
  answers: Answer[];
};

/** Body of `PUT /api/documents/projects/:id/ppci`: one item's answer; a null status clears it. */
export const answerBody = z.strictObject({
  version: z.string().regex(/^v\d+$/),
  groupPosition: z.number().int().min(1).max(100),
  itemPosition: z.number().int().min(1).max(500),
  status: z.enum(ANSWER_STATUSES).nullable(),
  note: z.string().trim().max(2000).nullable(),
});

export type AnswerInput = z.infer<typeof answerBody>;

type GroupRow = { position: number; name: string };
type ItemRow = ChecklistItem & { group_position: number };

/** Nests the item rows under their groups, keeping the order of both. */
export function buildGroups(
  groups: GroupRow[],
  items: ItemRow[],
): ChecklistGroup[] {
  return [...groups]
    .sort((a, b) => a.position - b.position)
    .map((group) => ({
      ...group,
      items: items
        .filter((item) => item.group_position === group.position)
        .sort((a, b) => a.position - b.position)
        .map(({ position, section, text, reference }) => ({
          position,
          section,
          text,
          reference,
        })),
    }));
}

export const answerKey = (group: number, item: number) => `${group}.${item}`;

export function answersByItem(answers: Answer[]) {
  return new Map(
    answers.map((answer) => [
      answerKey(answer.group_position, answer.item_position),
      answer,
    ]),
  );
}

export type GroupStats = {
  items: number;
  concluded: number;
  notApplicable: number;
  /** Not answered, or answered "Adequar". */
  pending: number;
  /** Percent of the applicable items that are concluded. */
  progress: number;
};

/** The control panel row of a group, as in Moura's sheet. */
export function groupStats(
  group: ChecklistGroup,
  answers: Map<string, Answer>,
): GroupStats {
  const statuses = group.items.map(
    (item) => answers.get(answerKey(group.position, item.position))?.status,
  );
  const concluded = statuses.filter((status) => status === "atende").length;
  const notApplicable = statuses.filter((status) => status === "na").length;
  const applicable = group.items.length - notApplicable;
  const progress =
    group.items.length === 0
      ? 0
      : applicable === 0
        ? 100
        : Math.round((concluded / applicable) * 100);
  return {
    items: group.items.length,
    concluded,
    notApplicable,
    pending: group.items.length - concluded - notApplicable,
    progress,
  };
}

export const fetchChecklist = (projectId: string) =>
  requestJson<ChecklistResponse>(`/api/documents/projects/${projectId}/ppci`);

export const saveAnswer = (projectId: string, input: AnswerInput) =>
  requestJson<void>(`/api/documents/projects/${projectId}/ppci`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
