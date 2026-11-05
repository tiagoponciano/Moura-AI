"use client";

import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFormImport } from "../hooks/use-form-import";

type FormImportProps = {
  onSaved: () => Promise<void>;
};

/** Paste a Google Docs or Drive link, review the forms it points to, save them. */
export function FormImport({ onSaved }: FormImportProps) {
  const importer = useFormImport(onSaved);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void importer.resolve();
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Adicionar formulários</CardTitle>
        <CardDescription>
          Cole o link de um Google Docs (um formulário) ou o link “Anexos da IN”
          do Google Drive (todos os formulários daquela IN).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={importer.url}
            onChange={(event) => importer.setUrl(event.target.value)}
            placeholder="https://drive.google.com/file/d/…"
            aria-label="Link do formulário"
          />
          <Button
            type="submit"
            disabled={!importer.url.trim() || importer.busy !== undefined}
          >
            {importer.busy === "resolving" && (
              <Loader2 className="animate-spin" />
            )}
            Buscar
          </Button>
        </form>

        {importer.drafts.length > 0 && (
          <ul className="flex flex-col divide-y rounded-md border">
            {importer.drafts.map((draft, index) => (
              <li
                key={draft.googleDocId}
                className="grid grid-cols-[auto_4rem_4rem_1fr] items-center gap-2 p-2"
              >
                <Switch
                  checked={draft.selected}
                  onCheckedChange={(selected) =>
                    importer.update(index, { selected })
                  }
                  aria-label={`Incluir ${draft.name}`}
                />
                <Input
                  value={draft.normative}
                  onChange={(event) =>
                    importer.update(index, { normative: event.target.value })
                  }
                  inputMode="numeric"
                  aria-label="IN"
                  placeholder="IN"
                />
                <Input
                  value={draft.annex}
                  onChange={(event) =>
                    importer.update(index, { annex: event.target.value })
                  }
                  aria-label="Anexo"
                  placeholder="Anexo"
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      importer.update(index, { name: event.target.value })
                    }
                    aria-label="Nome"
                  />
                  {draft.listed && (
                    <Badge variant="secondary">Já cadastrado</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {importer.problems.length > 0 && (
          <ul role="alert" className="text-sm text-destructive">
            {importer.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
        {importer.error && (
          <p role="alert" className="text-sm text-destructive">
            {importer.error}
          </p>
        )}
        {importer.notice && (
          <p className="text-sm text-success">{importer.notice}</p>
        )}
      </CardContent>
      {importer.drafts.length > 0 && (
        <CardFooter>
          <Button
            onClick={() => void importer.save()}
            disabled={
              importer.selectedCount === 0 || importer.busy !== undefined
            }
          >
            {importer.busy === "saving" && <Loader2 className="animate-spin" />}
            {importer.selectedCount === 1
              ? "Salvar 1 formulário"
              : `Salvar ${importer.selectedCount} formulários`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
