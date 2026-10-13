"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import type { CatalogProvider } from "@/lib/llm/catalog";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { setProviderKey } from "../lib/client";
import type { ProviderKeyHint } from "../lib/types";
import { FormStatus } from "./form-status";

type ProviderKeyFieldProps = {
  provider: CatalogProvider;
  hint: ProviderKeyHint | undefined;
  run: SaveRunner;
};

/** Write-only key for one provider: the last four characters with "Trocar", or the input when there is no key yet. */
export function ProviderKeyField({
  provider,
  hint,
  run,
}: ProviderKeyFieldProps) {
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState("");
  const { saving, status, save } = useSaveStatus(run);
  const inputId = `api-key-${provider.id}`;
  const showInput = !hint || editing;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (await save(() => setProviderKey(provider.id, key), "Chave salva.")) {
      setKey("");
      setEditing(false);
    }
  }

  function cancel() {
    setKey("");
    setEditing(false);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={showInput ? inputId : undefined}>
        Chave de API da {provider.label}
      </Label>
      {showInput ? (
        <form onSubmit={handleSubmit} className="grid gap-2">
          <div className="flex gap-2">
            <Input
              id={inputId}
              type="password"
              autoComplete="off"
              placeholder="Cole a chave aqui"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              className="min-w-0 flex-1 font-mono"
            />
            {hint && (
              <Button type="button" variant="ghost" onClick={cancel}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant="outline"
              disabled={saving || !key.trim()}
            >
              Salvar chave
            </Button>
          </div>
          {!hint && (
            <p className="text-xs text-muted-foreground">
              Sem chave, este provedor não pode ser usado.
            </p>
          )}
        </form>
      ) : (
        hint && (
          <div className="flex h-8 items-center gap-2.5">
            <span className="font-mono text-sm">••••{hint.lastFour}</span>
            <span className="flex-1 text-xs text-muted-foreground">
              atualizada em {formatDateTime(hint.updatedAt)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Trocar
            </Button>
          </div>
        )
      )}
      <FormStatus state={status} />
    </div>
  );
}
