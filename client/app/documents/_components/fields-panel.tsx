"use client";

import { CircleCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  FieldValue,
  FieldValues,
  TemplateField,
} from "@/lib/documents/templates";

type FieldsPanelProps = {
  fields: TemplateField[];
  values: FieldValues;
  onChange: (name: string, value: FieldValue | undefined) => void;
  showMissing?: boolean;
};

export function isEmptyValue(value: FieldValue | undefined): boolean {
  return (
    value === undefined || (typeof value === "string" && value.trim() === "")
  );
}

function parseNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FieldsPanel({
  fields,
  values,
  onChange,
  showMissing = false,
}: FieldsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const value = values[field.name];
        const missing =
          showMissing &&
          Boolean(field.required) &&
          field.type !== "boolean" &&
          isEmptyValue(value);
        const filled = field.type !== "boolean" && !isEmptyValue(value);
        const id = `field-${field.name}`;

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="flex items-start gap-1 leading-snug">
              <span>
                {field.description}
                {field.required && (
                  <span className="ml-0.5 text-destructive">*</span>
                )}
              </span>
              {filled && (
                <CircleCheck
                  className="mt-px ml-auto size-3.5 shrink-0 text-success"
                  aria-label="Preenchido"
                />
              )}
            </Label>

            {field.type === "boolean" ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={id}
                  checked={value === true}
                  onCheckedChange={(checked) => onChange(field.name, checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {value === true ? "Sim" : "Não"}
                </span>
              </div>
            ) : field.type === "string" ? (
              <Textarea
                id={id}
                rows={1}
                value={typeof value === "string" ? value : ""}
                onChange={(event) =>
                  onChange(
                    field.name,
                    event.target.value === "" ? undefined : event.target.value,
                  )
                }
                aria-invalid={missing}
                className="min-h-9 resize-none"
              />
            ) : (
              <Input
                id={id}
                type={field.type === "number" ? "number" : "text"}
                step={field.type === "number" ? "any" : undefined}
                inputMode={field.type === "number" ? "decimal" : undefined}
                placeholder={field.type === "date" ? "DD/MM/AAAA" : undefined}
                value={value === undefined ? "" : String(value)}
                onChange={(event) => {
                  const raw = event.target.value;
                  onChange(
                    field.name,
                    field.type === "number"
                      ? parseNumber(raw)
                      : raw === ""
                        ? undefined
                        : raw,
                  );
                }}
                aria-invalid={missing}
              />
            )}

            <span className="font-mono text-[11px] text-muted-foreground/70">{`{{${field.name}}}`}</span>
          </div>
        );
      })}
    </div>
  );
}
