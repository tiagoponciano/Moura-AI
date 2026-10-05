"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FieldValue, TemplateField } from "@/features/documents/lib/templates";

type FieldControlProps = {
  id: string;
  field: TemplateField;
  value: FieldValue | undefined;
  invalid: boolean;
  onChange: (value: FieldValue | undefined) => void;
};

function parseNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Input matching the field type: switch, auto-growing textarea or single-line input. */
export function FieldControl({
  id,
  field,
  value,
  invalid,
  onChange,
}: FieldControlProps) {
  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <span className="text-sm text-muted-foreground">
          {value === true ? "Sim" : "Não"}
        </span>
      </div>
    );
  }

  if (field.type === "string") {
    return (
      <Textarea
        id={id}
        rows={1}
        value={typeof value === "string" ? value : ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : event.target.value)
        }
        aria-invalid={invalid}
        className="min-h-9 resize-none"
      />
    );
  }

  return (
    <Input
      id={id}
      type={field.type === "number" ? "number" : "text"}
      step={field.type === "number" ? "any" : undefined}
      inputMode={field.type === "number" ? "decimal" : undefined}
      placeholder={field.type === "date" ? "DD/MM/AAAA" : undefined}
      value={value === undefined ? "" : String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        if (field.type === "number") onChange(parseNumber(raw));
        else onChange(raw === "" ? undefined : raw);
      }}
      aria-invalid={invalid}
    />
  );
}
