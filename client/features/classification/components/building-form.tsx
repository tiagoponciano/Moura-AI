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
import { ACTIVITY_BY_ID, activityLabel } from "../lib/catalog/activities";
import type { Classification } from "../lib/classify";
import type { Facts, FactValue } from "../lib/engine/types";
import { QUESTIONS, type Question } from "../lib/questions";

type BuildingFormProps = {
  answers: Facts;
  sources: FieldSources;
  progress: Classification["progress"];
  onChange: (fact: string, value: unknown) => void;
};

/** Strips the input chrome; the surrounding row shows hover and focus. */
const BARE_INPUT =
  "h-auto min-h-0 rounded-none border-0 bg-transparent p-0 font-medium shadow-none placeholder:font-normal focus-visible:ring-0 dark:bg-transparent";

const BARE_SELECT =
  "h-auto w-full rounded-none border-0 bg-transparent p-0 font-medium shadow-none focus-visible:ring-0 data-placeholder:font-normal data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent";

const UNKNOWN = "unknown";

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

/** The select value for an answer: "" while unanswered, "unknown" for não sei. */
function selectValue(value: FactValue | undefined): string {
  if (value === undefined) return "";
  if (value === null) return UNKNOWN;
  return String(value);
}

function AnswerControl({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: FactValue | undefined;
  onChange: (value: unknown) => void;
}) {
  const id = `answer-${question.fact}`;

  if (question.kind === "activity") {
    const activity =
      typeof value === "string" ? ACTIVITY_BY_ID.get(value) : undefined;
    return (
      <div className="flex items-center justify-between gap-2">
        <span
          id={id}
          className={cn(
            "text-sm",
            activity ? "font-medium" : "text-muted-foreground",
          )}
        >
          {activity ? activityLabel(activity) : "Não informada"}
        </span>
        {activity && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            limpar
          </button>
        )}
      </div>
    );
  }

  if (question.kind === "number") {
    return (
      <Input
        id={id}
        type="number"
        min={0}
        step={question.integer ? 1 : "any"}
        inputMode={question.integer ? "numeric" : "decimal"}
        placeholder="Não informado"
        value={typeof value === "number" ? value : ""}
        onChange={(event) =>
          onChange(
            event.target.value.trim() === ""
              ? undefined
              : Number(event.target.value),
          )
        }
        className={BARE_INPUT}
      />
    );
  }

  const options =
    question.kind === "boolean"
      ? [
          { value: "true", label: "Sim" },
          { value: "false", label: "Não" },
        ]
      : question.options;

  return (
    <Select
      value={selectValue(value)}
      onValueChange={(next) => {
        if (next === UNKNOWN) onChange(null);
        else if (question.kind === "boolean") onChange(next === "true");
        else onChange(next);
      }}
    >
      <SelectTrigger id={id} className={BARE_SELECT}>
        <SelectValue placeholder="Não informado" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {question.allowUnknown && (
          <SelectItem value={UNKNOWN}>Não sei</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

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
