"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ACTIVITY_BY_ID, activityLabel } from "../lib/catalog/activities";
import type { FactValue } from "../lib/engine/types";
import type { Question } from "../lib/questions";

/** Strips the input chrome; the surrounding row shows hover and focus. */
const BARE_INPUT =
  "h-auto min-h-0 rounded-none border-0 bg-transparent p-0 font-medium shadow-none placeholder:font-normal focus-visible:ring-0 dark:bg-transparent";

const BARE_SELECT =
  "h-auto w-full rounded-none border-0 bg-transparent p-0 font-medium shadow-none focus-visible:ring-0 data-placeholder:font-normal data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent";

const UNKNOWN = "unknown";

/** The select value for an answer: "" while unanswered, "unknown" for não sei. */
function selectValue(value: FactValue | undefined): string {
  if (value === undefined) return "";
  if (value === null) return UNKNOWN;
  return String(value);
}

type AnswerControlProps = {
  question: Question;
  value: FactValue | undefined;
  onChange: (value: unknown) => void;
};

/** The input that fits a question: the chosen activity, a number, or a menu. */
export function AnswerControl({
  question,
  value,
  onChange,
}: AnswerControlProps) {
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
