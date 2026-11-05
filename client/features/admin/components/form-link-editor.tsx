"use client";

import { Loader2, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { googleDocUrls } from "@/lib/cbmsc-forms/links";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { parseDocLink } from "../lib/forms";

type FormLinkEditorProps = {
  form: CbmscForm;
  busy: boolean;
  /** Resolves to whether it was saved; on `false` the editor stays open. */
  onSave: (googleDocId: string) => Promise<boolean>;
};

/** Pencil button that opens a field to replace a form's Google Docs link. */
export function FormLinkEditor({ form, busy, onSave }: FormLinkEditorProps) {
  const [url, setUrl] = useState<string>();
  const [problem, setProblem] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const id = parseDocLink(url ?? "");
    if (!id) {
      setProblem("Use o link de um Google Docs.");
      return;
    }
    setProblem(undefined);
    if (await onSave(id)) setUrl(undefined);
  }

  if (url === undefined) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setUrl(googleDocUrls(form.googleDocId).edit)}
        aria-label={`Editar o link de ${form.name}`}
      >
        <Pencil />
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex basis-full flex-col gap-1">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-label={`Novo link de ${form.name}`}
          aria-invalid={problem !== undefined}
        />
        <Button type="submit" size="sm" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          Salvar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setUrl(undefined);
            setProblem(undefined);
          }}
        >
          Cancelar
        </Button>
      </div>
      {problem && (
        <p role="alert" className="text-xs text-destructive">
          {problem}
        </p>
      )}
    </form>
  );
}
