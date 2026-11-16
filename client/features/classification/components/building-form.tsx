"use client";

import { sourceTag, type FieldSources } from "@/lib/field-sources";
import { cn } from "@/lib/utils";
import type { Classification } from "../lib/classify";
import type { Facts } from "../lib/engine/types";
import { QUESTIONS } from "../lib/questions";
import { AnswerControl } from "./answer-control";
import { AnswerRow } from "./answer-row";

type BuildingFormProps = {
  answers: Facts;
  sources: FieldSources;
  progress: Classification["progress"];
  onChange: (fact: string, value: unknown) => void;
};

/** The questions as field rows, editable by hand and filled by the assistant. */
export function BuildingForm({
  answers,
  sources,
  progress,
  onChange,
}: BuildingFormProps) {
  return (
    <section className="flex flex-col">
      <div className="flex flex-col gap-2.5 px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <h2 className="font-semibold">Dados da edificação</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.answered} de {progress.total} respondidas
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Perguntas respondidas"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.answered}
          className="flex gap-1"
        >
          {Array.from({ length: Math.max(progress.total, 1) }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full bg-muted transition-colors",
                index < progress.answered && "bg-success",
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col px-3 pb-2">
        {QUESTIONS.map((question) => {
          const value = answers[question.fact];
          return (
            <AnswerRow
              key={question.fact}
              id={`answer-${question.fact}`}
              label={question.label}
              filled={value !== undefined}
              tag={sourceTag(
                sources[question.fact],
                value === null ? "não sei" : value,
              )}
            >
              <AnswerControl
                question={question}
                value={value}
                onChange={(next) => onChange(question.fact, next)}
              />
            </AnswerRow>
          );
        })}
      </div>
    </section>
  );
}
