"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { groupByNormative } from "@/lib/cbmsc-forms/catalog";
import { googleDocUrls } from "@/lib/cbmsc-forms/links";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import type { FormChange } from "../lib/validation";
import { FormLinkEditor } from "./form-link-editor";

type FormCatalogProps = {
  forms: CbmscForm[];
  busyId?: string;
  onUpdate: (id: string, change: FormChange) => Promise<boolean>;
};

/** Every form in the catalog by IN, with its "Ativo" switch and link editor. */
export function FormCatalog({ forms, busyId, onUpdate }: FormCatalogProps) {
  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Formulários cadastrados</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {groupByNormative(forms).map((group) => (
          <section key={group.normative} className="flex flex-col gap-1">
            <h3 className="text-xs font-medium text-muted-foreground">
              IN {group.normative}
            </h3>
            <ul className="flex flex-col divide-y rounded-md border">
              {group.forms.map((form) => (
                <li
                  key={form.googleDocId}
                  className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
                >
                  <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                    Anexo {form.annex}
                  </span>
                  <span
                    className={
                      form.active
                        ? "flex-1"
                        : "flex-1 text-muted-foreground line-through"
                    }
                  >
                    {form.name}
                  </span>
                  <a
                    href={googleDocUrls(form.googleDocId).edit}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Abrir ${form.name} no Google Docs`}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <Switch
                    checked={form.active}
                    disabled={busyId === form.googleDocId}
                    onCheckedChange={(active) =>
                      void onUpdate(form.googleDocId, { active })
                    }
                    aria-label={`Ativo: ${form.name}`}
                  />
                  <FormLinkEditor
                    form={form}
                    busy={busyId === form.googleDocId}
                    onSave={(googleDocId) =>
                      onUpdate(form.googleDocId, { googleDocId })
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
