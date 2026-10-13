"use client";

import { useState, type FormEvent } from "react";
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
import { Label } from "@/components/ui/label";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { updateSettings } from "../lib/client";
import type { AdminSettingsResponse } from "../lib/types";
import { FormStatus } from "./form-status";

type AccessPanelProps = {
  data: AdminSettingsResponse;
  run: SaveRunner;
};

/** The e-mail domain allowed to sign in. */
export function AccessPanel({ data, run }: AccessPanelProps) {
  const saved = data.settings.allowedEmailDomain ?? "";
  const [domain, setDomain] = useState(saved);
  const { saving, status, save } = useSaveStatus(run);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void save(
      () => updateSettings({ allowedEmailDomain: domain }),
      "Domínio salvo.",
    );
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Acesso</CardTitle>
        <CardDescription>
          Só contas Google deste domínio conseguem entrar. Toda conta nova fica
          pendente até um administrador aprovar.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="contents">
        <CardContent className="grid max-w-lg gap-2">
          <Label htmlFor="allowed-domain">Domínio de e-mail permitido</Label>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span
              aria-hidden
              className="flex items-center border-r border-input bg-muted px-3 font-mono text-sm text-muted-foreground"
            >
              @
            </span>
            <Input
              id="allowed-domain"
              placeholder="mourasengenharia.com"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              className="min-w-0 flex-1 rounded-none border-0 font-mono shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Vazio: vale ALLOWED_EMAIL_DOMAIN do servidor; sem ela, qualquer
            conta Google entra.
          </p>
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <div className="min-w-0 flex-[1_1_240px]">
            <FormStatus state={status} />
          </div>
          <Button type="submit" disabled={saving || domain.trim() === saved}>
            Salvar domínio
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
