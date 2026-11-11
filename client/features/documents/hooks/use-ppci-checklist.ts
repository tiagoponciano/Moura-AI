"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import {
  answerKey,
  answersByItem,
  fetchChecklist,
  saveAnswer,
  type Answer,
  type AnswerStatus,
  type ChecklistResponse,
} from "../lib/ppci-answers";

/** The PPCI checklist of a project: items, answers and the saving of each one. */
export function usePpciChecklist(projectId: string) {
  const [checklist, setChecklist] = useState<ChecklistResponse>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    fetchChecklist(projectId).then(
      (body) => {
        if (cancelled) return;
        setChecklist(body);
        setAnswers(body.answers);
      },
      (cause) => {
        if (!cancelled) setError(errorMessage(cause));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const byItem = useMemo(() => answersByItem(answers), [answers]);

  /** Sets an item's status and/or note; shows it at once and restores the old answer if saving fails. */
  const answer = useCallback(
    (
      group: number,
      item: number,
      change: { status?: AnswerStatus | null; note?: string | null },
    ) => {
      if (!checklist) return;
      const key = answerKey(group, item);
      const previous = byItem.get(key);
      const next: Answer = {
        group_position: group,
        item_position: item,
        status: previous?.status ?? null,
        note: previous?.note ?? null,
        updated_by_name: previous?.updated_by_name ?? null,
        updated_at: new Date().toISOString(),
        ...change,
      };
      const replace = (value?: Answer) =>
        setAnswers((current) => [
          ...current.filter(
            (entry) =>
              answerKey(entry.group_position, entry.item_position) !== key,
          ),
          ...(value ? [value] : []),
        ]);
      replace(next);
      setError(undefined);
      saveAnswer(projectId, {
        version: checklist.version,
        groupPosition: group,
        itemPosition: item,
        status: next.status,
        note: next.note,
      }).catch((cause) => {
        replace(previous);
        setError(errorMessage(cause));
      });
    },
    [checklist, byItem, projectId],
  );

  return { checklist, answers: byItem, error, answer };
}
