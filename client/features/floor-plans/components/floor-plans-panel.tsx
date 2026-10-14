"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectedFloorPlan } from "../hooks/use-floor-plan";
import { ConversionNotice } from "./conversion-notice";
import { ConversionResult } from "./conversion-result";
import { PlanDropZone } from "./plan-drop-zone";
import { PlanPreview } from "./plan-preview";

type FloorPlansPanelProps = {
  plan?: SelectedFloorPlan;
  problem?: string;
  onSelect: (file: File) => void;
  onClear: () => void;
};

/** Side panel: the PDF upload and preview, the conversion result and the notice. */
export function FloorPlansPanel({
  plan,
  problem,
  onSelect,
  onClear,
}: FloorPlansPanelProps) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-card lg:border-l">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="flex flex-col gap-3 px-5 pt-4 pb-4">
          <h2 className="text-sm font-semibold">Planta</h2>
          {plan ? (
            <PlanPreview plan={plan} />
          ) : (
            <PlanDropZone problem={problem} onSelect={onSelect} />
          )}
        </section>
        <ConversionResult />
      </div>
      <div className="flex flex-col gap-2 border-t px-5 py-4">
        <ConversionNotice />
        <Button variant="outline" onClick={onClear} disabled={!plan}>
          <X />
          Remover planta
        </Button>
      </div>
    </aside>
  );
}
