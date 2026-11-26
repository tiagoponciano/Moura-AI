"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addConsulted,
  recheckMessage,
  type ConsultedNorm,
} from "../lib/consulted-norms";

type Outbox = { id: number; text: string };

/**
 * The norms the assistant consulted in the chat of one form, for the person to check.
 * The list belongs to the scope (the form): another form starts empty. "Não confere"
 * takes the passage off the list and queues a message asking the assistant to search again.
 */
export function useConsultedNorms(scope: string | undefined) {
  const [state, setState] = useState<{ scope?: string; list: ConsultedNorm[] }>(
    { list: [] },
  );
  const [outbox, setOutbox] = useState<Outbox>();
  const list = useMemo(
    () => (state.scope === scope ? state.list : []),
    [state, scope],
  );

  const record = useCallback(
    (toolName: string, output: unknown) =>
      setState((current) => ({
        scope,
        list: addConsulted(
          current.scope === scope ? current.list : [],
          toolName,
          output,
        ),
      })),
    [scope],
  );

  const confirm = useCallback(
    (key: string) =>
      setState((current) => ({
        ...current,
        list: current.list.map((item) =>
          item.key === key ? { ...item, confirmed: true } : item,
        ),
      })),
    [],
  );

  const reject = useCallback(
    (key: string) => {
      const norm = list.find((item) => item.key === key);
      if (!norm) return;
      setState((current) => ({
        ...current,
        list: current.list.filter((item) => item.key !== key),
      }));
      setOutbox((previous) => ({
        id: (previous?.id ?? 0) + 1,
        text: recheckMessage(norm),
      }));
    },
    [list],
  );

  const clearOutbox = useCallback(() => setOutbox(undefined), []);

  return { list, record, confirm, reject, outbox, clearOutbox };
}
