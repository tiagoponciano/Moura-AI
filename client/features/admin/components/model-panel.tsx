"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LLM_CATALOG,
  findCatalogProvider,
  type LlmProvider,
} from "@/lib/llm/catalog";
import { cn } from "@/lib/utils";
import { useModelChoice } from "../hooks/use-model-choice";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { updateSettings } from "../lib/client";
import { canSaveModel, describeModelChoice } from "../lib/sections";
import type { AdminSettingsResponse, AdminUser } from "../lib/types";
import { FormStatus } from "./form-status";
import { ModelSelect } from "./model-select";
import { ProviderAccessField } from "./provider-access-field";
import { ProviderCard } from "./provider-card";
import { ProviderKeyField } from "./provider-key-field";

type ModelPanelProps = {
  data: AdminSettingsResponse;
  run: SaveRunner;
  users: AdminUser[];
};

/** Provider and model used by every chat, with the chosen provider's API key. */
export function ModelPanel({ data, run, users }: ModelPanelProps) {
  const saved = data.settings;
  const {
    provider,
    model,
    setModel,
    selectProvider,
    discard,
    unchanged,
    choice,
  } = useModelChoice(data);
  const { saving, status, save } = useSaveStatus(run);

  const entry = provider ? findCatalogProvider(provider) : undefined;
  const line = describeModelChoice(choice);
  const showSaveStatus =
    status.kind === "error" || (status.kind === "saved" && unchanged);
  const hintFor = (id: LlmProvider) =>
    data.keys.find((key) => key.provider === id);

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
          <ModelSelect provider={entry} value={model} onChange={setModel} />
          {entry && (
            <ProviderKeyField
              key={entry.id}
              provider={entry}
              hint={hintFor(entry.id)}
              run={run}
            />
          )}
          {entry && (
            <ProviderAccessField
              key={`access-${entry.id}`}
              provider={entry}
              saved={data.access.find((item) => item.provider === entry.id)}
              users={users}
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
