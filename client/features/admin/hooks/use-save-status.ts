"use client";

import { useState } from "react";

/** `useAdminSettings().run`: saves, reloads, and resolves to the error message, if any. */
export type SaveRunner = (
  save: () => Promise<void>,
) => Promise<string | undefined>;

export type FormStatusState =
  | { kind: "idle" }
  | { kind: "saved"; text: string }
  | { kind: "error"; text: string };

/** One form's save: `saving` while it runs, then `status` with `savedText` or the server's error. */
export function useSaveStatus(run: SaveRunner) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<FormStatusState>({ kind: "idle" });

  /** Resolves to whether the save succeeded. */
  async function save(
    action: () => Promise<void>,
    savedText: string,
  ): Promise<boolean> {
    setSaving(true);
    const error = await run(action);
    setSaving(false);
    setStatus(
      error
        ? { kind: "error", text: error }
        : { kind: "saved", text: savedText },
    );
    return !error;
  }

  return { saving, status, save };
}
