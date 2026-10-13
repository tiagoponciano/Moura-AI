"use client";

import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { sourceTag, type FieldSources } from "../lib/field-sources";
import { isEmptyValue } from "../lib/form-values";
import type { FieldValue, FieldValues, TemplateField } from "../lib/templates";
import { FieldControl } from "./field-control";

type FieldListProps = {
  fields: TemplateField[];
  values: FieldValues;
  sources: FieldSources;
  onChange: (name: string, value: FieldValue | undefined) => void;
  showMissing?: boolean;
};

/** Fields grouped into required and optional, one row per field with a status dot and source tag. */
export function FieldList({
  fields,
  values,
  sources,
  onChange,
  showMissing = false,
}: FieldListProps) {
  const groups = [
    { label: "Obrigatórios", fields: fields.filter((field) => field.required) },
    { label: "Opcionais", fields: fields.filter((field) => !field.required) },
  ].filter((group) => group.fields.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col">
          <h3 className="px-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {group.label}
          </h3>
          {group.fields.map((field) => {
            const value = values[field.name];
            const missing =
              showMissing &&
              Boolean(field.required) &&
              field.type !== "boolean" &&
              isEmptyValue(value);
            const filled = field.type !== "boolean" && !isEmptyValue(value);
            const tag = sourceTag(sources[field.name], value);
            const id = `field-${field.name}`;

            return (
              <div
                key={field.name}
                className="grid grid-cols-[8px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg p-2 transition-colors focus-within:bg-accent hover:bg-muted focus-within:hover:bg-accent"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2 rounded-full border-[1.5px] border-input",
                    filled && "border-0 bg-success",
                    missing && "border-destructive",
                  )}
                />
                <Label
                  htmlFor={id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs leading-snug font-normal text-muted-foreground",
                    missing && "text-destructive",
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{field.label}</span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="flex max-w-64 flex-col gap-0.5"
                    >
                      <span>{field.description}</span>
                      <span className="font-mono opacity-70">
                        {`{{${field.name}}}`}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                  {tag && (
                    <span
                      className={cn(
                        "rounded px-1.5 text-[10px] leading-4 font-medium",
                        tag === "IA"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tag}
                    </span>
                  )}
                </Label>
                <div className="col-start-2">
                  <FieldControl
                    id={id}
                    field={field}
                    value={value}
                    invalid={missing}
                    onChange={(next) => onChange(field.name, next)}
                  />
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
