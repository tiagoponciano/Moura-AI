import { ChevronDown } from "lucide-react";
import { BUILDING_FIELD_LABEL } from "../lib/building";
import type { Requirement } from "../lib/evaluate";

/** One system as a panel row: required ones expand to their checks, pending ones list the missing answers. */
export function RequirementRow({ requirement }: { requirement: Requirement }) {
  if (requirement.status === "required") {
    return (
      <details className="group rounded-lg transition-colors open:bg-muted/50">
        <summary className="grid cursor-pointer list-none grid-cols-[8px_minmax(0,1fr)_16px] gap-x-3 gap-y-0.5 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="mt-1.5 size-2 rounded-full bg-primary" />
          <span className="text-sm leading-snug font-medium">
            {requirement.system}
          </span>
          <ChevronDown className="mt-0.5 size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          <span className="col-start-2 text-xs leading-snug text-muted-foreground first-letter:uppercase">
            {requirement.reason}
          </span>
        </summary>
        {requirement.checks.length > 0 && (
          <ul className="flex flex-col gap-1.5 pt-0.5 pr-2 pb-3 pl-7">
            {requirement.checks.map((check) => (
              <li key={check} className="flex gap-2 text-[13px] leading-snug">
                <span
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0 rounded border-[1.5px] border-input"
                />
                {check}
              </li>
            ))}
          </ul>
        )}
      </details>
    );
  }

  const pending = requirement.status === "needs_info";

  return (
    <div className="grid grid-cols-[8px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg p-2">
      <span
        aria-hidden
        className={
          pending
            ? "mt-1.5 size-2 rounded-full border-[1.5px] border-input"
            : "mt-1.5 size-2 rounded-full bg-input"
        }
      />
      <span
        className={
          pending
            ? "text-sm leading-snug font-medium"
            : "text-sm leading-snug text-muted-foreground"
        }
      >
        {requirement.system}
      </span>
      {pending && (
        <span className="col-start-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          Falta
          {requirement.missing.map((field) => (
            <span
              key={field}
              className="rounded bg-muted px-1.5 text-[10px] leading-4 font-medium"
            >
              {BUILDING_FIELD_LABEL[field].toLowerCase()}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
