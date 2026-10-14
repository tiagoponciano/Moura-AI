"use client";

import type { ReactNode } from "react";
import { SourceTagBadge } from "@/components/shared/source-tag-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sourceTag, type FieldSources } from "@/lib/field-sources";
import { cn } from "@/lib/utils";
import {
  OCCUPANCIES,
  QUESTION_COUNT,
  type Building,
  type OccupancyId,
} from "../lib/building";

type BuildingFormProps = {
  building: Building;
  sources: FieldSources;
  answered: number;
  onChange: <K extends keyof Building>(
    field: K,
    value: Building[K] | undefined,
  ) => void;
};

const MEASURES = [
  { field: "areaM2", label: "Área construída (m²)", integer: false },
  { field: "heightM", label: "Altura (m)", integer: false },
  { field: "floorCount", label: "Pavimentos", integer: true },
] as const;

/** Strips the input chrome; the surrounding row shows hover and focus. */
const BARE_INPUT =
  "h-auto min-h-0 rounded-none border-0 bg-transparent p-0 font-medium shadow-none placeholder:font-normal focus-visible:ring-0 dark:bg-transparent";

function parsePositive(raw: string, integer: boolean): number | undefined {
  const parsed = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(parsed) || parsed <= 0)
    return undefined;
  return integer ? Math.trunc(parsed) : parsed;
}

type AnswerRowProps = {
  id: string;
  label: string;
  filled: boolean;
  tag: ReturnType<typeof sourceTag>;
  children: ReactNode;
};

function AnswerRow({ id, label, filled, tag, children }: AnswerRowProps) {
  return (
    <div className="grid grid-cols-[8px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg p-2 transition-colors focus-within:bg-accent hover:bg-muted focus-within:hover:bg-accent">
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2 rounded-full border-[1.5px] border-input",
          filled && "border-0 bg-success",
        )}
      />
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs leading-snug font-normal text-muted-foreground"
      >
        {label}
        {tag && <SourceTagBadge tag={tag} />}
      </Label>
      <div className="col-start-2">{children}</div>
    </div>
  );
}

/** The four key questions as field rows, editable by hand and filled by the assistant. */
export function BuildingForm({
  building,
  sources,
  answered,
  onChange,
}: BuildingFormProps) {
  return (
    <section className="flex flex-col">
      <div className="flex flex-col gap-2.5 px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <h2 className="font-semibold">Dados da edificação</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {answered} de {QUESTION_COUNT} respondidas
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Perguntas respondidas"
          aria-valuemin={0}
          aria-valuemax={QUESTION_COUNT}
          aria-valuenow={answered}
          className="flex gap-1"
        >
          {Array.from({ length: QUESTION_COUNT }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full bg-muted transition-colors",
                index < answered && "bg-success",
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col px-3 pb-2">
        {MEASURES.map(({ field, label, integer }) => (
          <AnswerRow
            key={field}
            id={`building-${field}`}
            label={label}
            filled={building[field] !== undefined}
            tag={sourceTag(sources[field], building[field])}
          >
            <Input
              id={`building-${field}`}
              type="number"
              min={0}
              step={integer ? 1 : "any"}
              inputMode={integer ? "numeric" : "decimal"}
              placeholder="Não informado"
              value={building[field] ?? ""}
              onChange={(event) =>
                onChange(field, parsePositive(event.target.value, integer))
              }
              className={BARE_INPUT}
            />
          </AnswerRow>
        ))}
        <AnswerRow
          id="building-occupancy"
          label="Ocupação"
          filled={building.occupancy !== undefined}
          tag={sourceTag(sources.occupancy, building.occupancy)}
        >
          <Select
            value={building.occupancy ?? ""}
            onValueChange={(value) =>
              onChange("occupancy", value as OccupancyId)
            }
          >
            <SelectTrigger
              id="building-occupancy"
              className="h-auto w-full rounded-none border-0 bg-transparent p-0 font-medium shadow-none focus-visible:ring-0 data-placeholder:font-normal data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent"
            >
              <SelectValue placeholder="Não informado" />
            </SelectTrigger>
            <SelectContent>
              {OCCUPANCIES.map((occupancy) => (
                <SelectItem key={occupancy.id} value={occupancy.id}>
                  {occupancy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AnswerRow>
      </div>
    </section>
  );
}
