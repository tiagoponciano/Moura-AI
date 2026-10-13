"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LLM_CATALOG,
  findCatalogProvider,
  type LlmProvider,
} from "@/lib/llm/catalog";
import { cn } from "@/lib/utils";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { updateSettings } from "../lib/client";
import { canSaveModel, describeModelChoice } from "../lib/sections";
import type { AdminSettingsResponse } from "../lib/types";
import { FormStatus } from "./form-status";
import { ProviderCard } from "./provider-card";
import { ProviderKeyField } from "./provider-key-field";

type ModelPanelProps = {
  data: AdminSettingsResponse;
  run: SaveRunner;
};

/** Provider and model used by every chat, with the chosen provider's API key. */
export function ModelPanel({ data, run }: ModelPanelProps) {
  const saved = data.settings;
  const [provider, setProvider] = useState<LlmProvider | undefined>(
    saved.provider ?? undefined,
  );
  const [model, setModel] = useState<string | undefined>(
    saved.model ?? undefined,
  );
  const { saving, status, save } = useSaveStatus(run);

  const entry = provider ? findCatalogProvider(provider) : undefined;
  const choice = { provider, model, saved, keys: data.keys };
  const line = describeModelChoice(choice);
  const unchanged =
    provider === (saved.provider ?? undefined) &&
    model === (saved.model ?? undefined);
  const showSaveStatus =
    status.kind === "error" || (status.kind === "saved" && unchanged);
  const hintFor = (id: LlmProvider) =>
    data.keys.find((key) => key.provider === id);

  function selectProvider(next: LlmProvider) {
    setProvider(next);
    setModel(
      next === saved.provider && saved.model
        ? saved.model
        : findCatalogProvider(next)?.models[0]?.id,
    );
  }

  function discard() {
    setProvider(saved.provider ?? undefined);
    setModel(saved.model ?? undefined);
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Modelo de IA</CardTitle>
        <CardDescription>
          Usado por todas as conversas da Moura AI. A chave fica guardada no
          cofre do Supabase e nunca é exibida.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Provedor</legend>
          <div className="flex flex-wrap gap-2.5">
            {LLM_CATALOG.map((option) => (
              <ProviderCard
                key={option.id}
                provider={option}
                hint={hintFor(option.id)}
                selected={provider === option.id}
                inUse={saved.provider === option.id}
                onSelect={() => selectProvider(option.id)}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid items-start gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="llm-model">Modelo</Label>
            <Select value={model} onValueChange={setModel} disabled={!entry}>
              <SelectTrigger id="llm-model" className="w-full">
                <SelectValue placeholder="Escolha um modelo" />
              </SelectTrigger>
              <SelectContent>
                {entry?.models.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {entry && (
            <ProviderKeyField
              key={entry.id}
              provider={entry}
              hint={hintFor(entry.id)}
              run={run}
            />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-wrap gap-3">
        <div className="min-w-0 flex-[1_1_240px]">
          {showSaveStatus ? (
            <FormStatus state={status} />
          ) : (
            <p
              className={cn(
                "text-xs",
                line.tone === "warning"
                  ? "text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {line.text}
            </p>
          )}
        </div>
        <Button variant="ghost" disabled={unchanged} onClick={discard}>
          Descartar
        </Button>
        <Button
          disabled={saving || !canSaveModel(choice)}
          onClick={() =>
            provider &&
            model &&
            void save(
              () => updateSettings({ llm: { provider, model } }),
              "Modelo salvo.",
            )
          }
        >
          Salvar modelo
        </Button>
      </CardFooter>
    </Card>
  );
}
