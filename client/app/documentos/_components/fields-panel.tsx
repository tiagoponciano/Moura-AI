"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FieldValue, FieldValues, TemplateField } from "@/lib/documents/templates";

type FieldsPanelProps = {
  fields: TemplateField[];
  values: FieldValues;
  onChange: (name: string, value: FieldValue | undefined) => void;
};

export function isEmptyValue(value: FieldValue | undefined): boolean {
  return value === undefined || (typeof value === "string" && value.trim() === "");
}

function parseNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FieldsPanel({ fields, values, onChange }: FieldsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const value = values[field.nome];
        const missing = Boolean(field.obrigatorio) && field.tipo !== "boolean" && isEmptyValue(value);
        const id = `field-${field.nome}`;

        return (
          <div key={field.nome} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="flex items-baseline gap-1">
              <span>{field.descricao}</span>
              {field.obrigatorio && <span className="text-destructive">*</span>}
            </Label>

            {field.tipo === "boolean" ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={id}
                  checked={value === true}
                  onCheckedChange={(checked) => onChange(field.nome, checked)}
                />
                <span className="text-sm text-muted-foreground">{value === true ? "Sim" : "Não"}</span>
              </div>
            ) : field.tipo === "string" ? (
              <Textarea
                id={id}
                rows={1}
                value={typeof value === "string" ? value : ""}
                onChange={(event) =>
                  onChange(field.nome, event.target.value === "" ? undefined : event.target.value)
                }
                aria-invalid={missing}
                className="min-h-9 resize-none"
              />
            ) : (
              <Input
                id={id}
                type={field.tipo === "number" ? "number" : "text"}
                step={field.tipo === "number" ? "any" : undefined}
                inputMode={field.tipo === "number" ? "decimal" : undefined}
                placeholder={field.tipo === "date" ? "DD/MM/AAAA" : undefined}
                value={value === undefined ? "" : String(value)}
                onChange={(event) => {
                  const raw = event.target.value;
                  onChange(field.nome, field.tipo === "number" ? parseNumber(raw) : raw === "" ? undefined : raw);
                }}
                aria-invalid={missing}
              />
            )}

            <span className="font-mono text-[11px] text-muted-foreground">{`{{${field.nome}}}`}</span>
          </div>
        );
      })}
    </div>
  );
}
