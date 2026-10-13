"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "../lib/client";
import type { AdminSettingsResponse } from "../lib/types";
import { FormStatus, type FormStatusState } from "./form-status";

type AccessPanelProps = {
  data: AdminSettingsResponse;
  run: (save: () => Promise<void>) => Promise<string | undefined>;
};

/** The e-mail domain allowed to sign in. */
export function AccessPanel({ data, run }: AccessPanelProps) {
  const saved = data.settings.allowedEmailDomain ?? "";
  const [domain, setDomain] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<FormStatusState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const error = await run(() =>
      updateSettings({ allowedEmailDomain: domain }),
    );
    setSaving(false);
    setStatus(
      error
        ? { kind: "error", text: error }
        : { kind: "saved", text: "Domínio salvo." },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso</CardTitle>
        <CardDescription>
          Só contas Google deste domínio conseguem entrar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-1.5">
          <Label htmlFor="allowed-domain">Domínio de e-mail permitido</Label>
          <div className="flex gap-2">
            <Input
              id="allowed-domain"
              placeholder="mourasengenharia.com"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={saving || domain.trim() === saved}
            >
              Salvar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Vazio usa ALLOWED_EMAIL_DOMAIN do ambiente; se ela também estiver
            vazia, qualquer domínio entra.
          </p>
          <FormStatus state={status} />
        </form>
      </CardContent>
    </Card>
  );
}
