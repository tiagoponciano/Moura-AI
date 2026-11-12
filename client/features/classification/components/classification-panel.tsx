"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldSources } from "@/lib/field-sources";
import type { Classification } from "../lib/classify";
import type { Facts } from "../lib/engine/types";
import { AnalysisNotice } from "./analysis-notice";
import { BuildingForm } from "./building-form";
import { DerivedData } from "./derived-data";
import { NextQuestions } from "./next-questions";
import { ProvisionalNotice } from "./provisional-notice";
import { RequirementsList } from "./requirements-list";
import { RiskLevel } from "./risk-level";

type ClassificationPanelProps = {
  answers: Facts;
  sources: FieldSources;
  classification: Classification;
  onChange: (fact: string, value: unknown) => void;
  onReset: () => void;
};

/** Side panel: the questions, what is next, the systems they imply and the provisional notice. */
export function ClassificationPanel({
  answers,
  sources,
  classification,
  onChange,
  onReset,
}: ClassificationPanelProps) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-card lg:border-l">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <BuildingForm
          answers={answers}
          sources={sources}
          progress={classification.progress}
          onChange={onChange}
        />
        <DerivedData
          derived={classification.derived}
          conflicts={classification.conflicts}
        />
        <NextQuestions classification={classification} />
        <AnalysisNotice analyses={classification.analyses} />
        <RiskLevel risk={classification.risk} />
        <RequirementsList classification={classification} />
      </div>
      <div className="flex flex-col gap-2 border-t px-5 py-4">
        <ProvisionalNotice />
        <Button
          variant="outline"
          onClick={onReset}
          disabled={classification.progress.answered === 0}
        >
          <RotateCcw />
          Limpar respostas
        </Button>
      </div>
    </aside>
  );
}
