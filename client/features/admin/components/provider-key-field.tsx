"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import type { CatalogProvider } from "@/lib/llm/catalog";
import { setProviderKey } from "../lib/client";
import type { ProviderKeyHint } from "../lib/types";
import { FormStatus, type FormStatusState } from "./form-status";

type ProviderKeyFieldProps = {
  provider: CatalogProvider;
  hint: ProviderKeyHint | undefined;
  run: (save: () => Promise<void>) => Promise<string | undefined>;
};

/** Write-only key input: shows the last four characters, never the key. */
export function ProviderKeyField({
  provider,
  hint,
  run,
}: ProviderKeyFieldProps) {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<FormStatusState>({ kind: "idle" });
  const inputId = `api-key-${provider.id}`;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const error = await run(() => setProviderKey(provider.id, key));
    setSaving(false);
    if (error) {
      setStatus({ kind: "error", text: error });
      return;
    }
    setKey("");
    setStatus({ kind: "saved", text: "Chave salva." });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-1.5">
      <Label htmlFor={inputId}>Chave da {provider.label}</Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          type="password"
          autoComplete="off"
          placeholder={
            hint ? `••••${hint.lastFour}` : "Nenhuma chave cadastrada"
          }
          value={key}
          onChange={(event) => setKey(event.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={saving || !key.trim()}
        >
          {hint ? "Trocar" : "Salvar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {hint
          ? `Termina em ••••${hint.lastFour}, atualizada em ${formatDateTime(hint.updatedAt)}.`
          : "Sem chave para este provedor."}
      </p>
      <FormStatus state={status} />
    </form>
  );
}
