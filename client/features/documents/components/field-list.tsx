"use client";

import { CircleCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isEmptyValue } from "../lib/form-values";
import type { FieldValue, FieldValues, TemplateField } from "../lib/templates";
import { FieldControl } from "./field-control";

type FieldListProps = {
  fields: TemplateField[];
  values: FieldValues;
  onChange: (name: string, value: FieldValue | undefined) => void;
  showMissing?: boolean;
};

export function FieldList({
  fields,
  values,
  onChange,
  showMissing = false,
}: FieldListProps) {
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    {field.description}
                    {field.required && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-mono">
                  {`{{${field.name}}}`}
                </TooltipContent>
              </Tooltip>
              {filled && (
                <CircleCheck
                  className="mt-px ml-auto size-3.5 shrink-0 text-success"
                  aria-label="Preenchido"
                />
              )}
            </Label>
            <FieldControl
              id={id}
              field={field}
              value={value}
              invalid={missing}
              onChange={(next) => onChange(field.name, next)}
            />
          </div>
        );
      })}
    </div>
  );
}
