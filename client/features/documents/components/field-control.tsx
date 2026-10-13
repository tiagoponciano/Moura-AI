"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldValue, TemplateField } from "../lib/templates";

type FieldControlProps = {
  id: string;
  field: TemplateField;
  value: FieldValue | undefined;
  invalid: boolean;
  onChange: (value: FieldValue | undefined) => void;
};

/** Strips the input chrome; the surrounding field row shows hover, focus and missing state. */
const BARE_INPUT =
  "h-auto min-h-0 rounded-none border-0 bg-transparent p-0 font-medium shadow-none placeholder:font-normal focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent";

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
        placeholder="Não informado"
        className={cn(BARE_INPUT, "resize-none")}
      />
    );
  }

  return (
    <Input
      id={id}
      type={field.type === "number" ? "number" : "text"}
      step={field.type === "number" ? "any" : undefined}
      inputMode={field.type === "number" ? "decimal" : undefined}
      placeholder={field.type === "date" ? "DD/MM/AAAA" : "Não informado"}
      value={value === undefined ? "" : String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        if (field.type === "number") onChange(parseNumber(raw));
        else onChange(raw === "" ? undefined : raw);
      }}
      aria-invalid={invalid}
      className={BARE_INPUT}
    />
  );
}
