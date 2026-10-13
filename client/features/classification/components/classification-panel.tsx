"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldSources } from "@/lib/field-sources";
import type { Building } from "../lib/building";
import type { RequirementGroups } from "../lib/evaluate";
import { BuildingForm } from "./building-form";
import { ProvisionalNotice } from "./provisional-notice";
import { RequirementsList } from "./requirements-list";

type ClassificationPanelProps = {
  building: Building;
  sources: FieldSources;
  answered: number;
  groups: RequirementGroups;
  onChange: <K extends keyof Building>(
    field: K,
    value: Building[K] | undefined,
  ) => void;
  onReset: () => void;
};

/** Side panel: the key questions, the systems they imply and the provisional notice. */
export function ClassificationPanel({
  building,
  sources,
  answered,
  groups,
  onChange,
  onReset,
}: ClassificationPanelProps) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-card lg:border-l">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <BuildingForm
          building={building}
          sources={sources}
          answered={answered}
          onChange={onChange}
        />
        <RequirementsList groups={groups} />
      </div>
      <div className="flex flex-col gap-2 border-t px-5 py-4">
        <ProvisionalNotice />
        <Button variant="outline" onClick={onReset} disabled={answered === 0}>
          <RotateCcw />
          Limpar respostas
        </Button>
      </div>
    </aside>
  );
}
