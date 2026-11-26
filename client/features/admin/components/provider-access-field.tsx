"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CatalogProvider } from "@/lib/llm/catalog";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { setProviderAccess } from "../lib/client";
import {
  accessChanged,
  describeAccess,
  toggleUser,
} from "../lib/provider-access";
import type { AdminUser, ProviderAccess } from "../lib/types";
import { FormStatus } from "./form-status";

type ProviderAccessFieldProps = {
  provider: CatalogProvider;
  saved: ProviderAccess | undefined;
  users: AdminUser[];
  run: SaveRunner;
};

/** Who may use a provider: everyone, or only the users ticked here. */
export function ProviderAccessField({
  provider,
  saved,
  users,
  run,
}: ProviderAccessFieldProps) {
  const [restricted, setRestricted] = useState(saved?.restricted ?? false);
  const [userIds, setUserIds] = useState(saved?.userIds ?? []);
  const { saving, status, save } = useSaveStatus(run);
  const changed = accessChanged(saved, restricted, userIds);
  const approved = users.filter((user) => user.status === "approved");

  return (
    <fieldset className="grid gap-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`restrict-${provider.id}`}>
          Restringir o uso da {provider.label}
        </Label>
        <Switch
          id={`restrict-${provider.id}`}
          checked={restricted}
          onCheckedChange={setRestricted}
        />
      </div>
      {restricted && (
        <ul className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border p-2">
          {approved.map((user) => (
            <li key={user.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <input
                  type="checkbox"
                  checked={userIds.includes(user.id)}
                  onChange={() => setUserIds((ids) => toggleUser(ids, user.id))}
                />
                <span className="truncate">{user.name ?? user.email}</span>
                {user.name && (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {describeAccess(restricted, userIds.length)} Quem não tem acesso usa o
          próximo provedor liberado para si.
        </p>
        <FormStatus state={status} />
        <Button
          variant="outline"
          disabled={saving || !changed}
          onClick={() =>
            void save(
              () => setProviderAccess(provider.id, { restricted, userIds }),
              "Acesso salvo.",
            )
          }
        >
          Salvar acesso
        </Button>
      </div>
    </fieldset>
  );
}
