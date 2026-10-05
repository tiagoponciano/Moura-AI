"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OCCUPANCIES, type Building, type OccupancyId } from "../lib/building";

type BuildingFormProps = {
  building: Building;
  onChange: <K extends keyof Building>(
    field: K,
    value: Building[K] | undefined,
  ) => void;
  onReset: () => void;
};

const MEASURES = [
  { field: "areaM2", label: "Área construída (m²)", integer: false },
  { field: "heightM", label: "Altura (m)", integer: false },
  { field: "floorCount", label: "Pavimentos", integer: true },
] as const;

function parsePositive(raw: string, integer: boolean): number | undefined {
  const parsed = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(parsed) || parsed <= 0)
    return undefined;
  return integer ? Math.trunc(parsed) : parsed;
}

/** The four key questions, editable by hand and filled by the assistant. */
export function BuildingForm({
  building,
  onChange,
  onReset,
}: BuildingFormProps) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Dados da edificação</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={Object.values(building).every((v) => v === undefined)}
        >
          <RotateCcw />
          Limpar
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MEASURES.map(({ field, label, integer }) => (
          <div key={field} className="flex flex-col gap-1.5">
            <Label htmlFor={`building-${field}`}>{label}</Label>
            <Input
              id={`building-${field}`}
              type="number"
              min={0}
              step={integer ? 1 : "any"}
              inputMode={integer ? "numeric" : "decimal"}
              value={building[field] ?? ""}
              onChange={(event) =>
                onChange(field, parsePositive(event.target.value, integer))
              }
            />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="building-occupancy">Ocupação</Label>
          <Select
            value={building.occupancy ?? ""}
            onValueChange={(value) =>
              onChange("occupancy", value as OccupancyId)
            }
          >
            <SelectTrigger id="building-occupancy" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {OCCUPANCIES.map((occupancy) => (
                <SelectItem key={occupancy.id} value={occupancy.id}>
                  {occupancy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
