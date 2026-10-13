"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  LLM_CATALOG,
  findCatalogProvider,
  type LlmProvider,
} from "@/lib/llm/catalog";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { updateSettings } from "../lib/client";
import type { AdminSettingsResponse } from "../lib/types";
import { FormStatus } from "./form-status";
import { ProviderKeyField } from "./provider-key-field";
import { SetupNotice } from "./setup-notice";

type ModelPanelProps = {
  data: AdminSettingsResponse;
  run: SaveRunner;
};

/** Provider and model used by every chat, plus one API key per provider. */
export function ModelPanel({ data, run }: ModelPanelProps) {
  const saved = data.settings;
  const [provider, setProvider] = useState<LlmProvider | undefined>(
    saved.provider ?? undefined,
  );
  const [model, setModel] = useState<string | undefined>(
    saved.model ?? undefined,
  );
  const { saving, status, save } = useSaveStatus(run);

  const models = provider ? (findCatalogProvider(provider)?.models ?? []) : [];
  const savedProvider = saved.provider && findCatalogProvider(saved.provider);
  const savedHasKey = data.keys.some((key) => key.provider === saved.provider);
  const unchanged = provider === saved.provider && model === saved.model;

  function handleProviderChange(value: string) {
    const next = value as LlmProvider;
    setProvider(next);
    setModel(findCatalogProvider(next)?.models[0]?.id);
  }

  function saveModel(llm: { provider: LlmProvider; model: string }) {
    void save(() => updateSettings({ llm }), "Modelo salvo.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelo de IA</CardTitle>
        <CardDescription>
          Usado por todas as conversas da Moura AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!data.serviceRoleConfigured && (
          <SetupNotice>
            <span className="font-medium">
              SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.
            </span>{" "}
            As conversas não funcionam até ela ser definida nas variáveis de
            ambiente do deploy.
          </SetupNotice>
        )}
        {savedProvider && !savedHasKey && (
          <SetupNotice>
            Sem chave da {savedProvider.label}: as conversas não funcionam até
            uma chave ser cadastrada abaixo.
          </SetupNotice>
        )}
        {!saved.provider && (
          <SetupNotice>
            Nenhum modelo salvo: as conversas não funcionam até um provedor e um
            modelo serem escolhidos.
          </SetupNotice>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="llm-provider">Provedor</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger id="llm-provider" className="w-full">
                <SelectValue placeholder="Escolha um provedor" />
              </SelectTrigger>
              <SelectContent>
                {LLM_CATALOG.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="llm-model">Modelo</Label>
            <Select value={model} onValueChange={setModel} disabled={!provider}>
              <SelectTrigger id="llm-model" className="w-full">
                <SelectValue placeholder="Escolha um modelo" />
              </SelectTrigger>
              <SelectContent>
                {models.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={saving || !provider || !model || unchanged}
            onClick={() => provider && model && saveModel({ provider, model })}
          >
            Salvar modelo
          </Button>
          <FormStatus state={status} />
        </div>

        <Separator />

        <div className="grid gap-4">
          {LLM_CATALOG.map((entry) => (
            <ProviderKeyField
              key={entry.id}
              provider={entry}
              hint={data.keys.find((key) => key.provider === entry.id)}
              run={run}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
