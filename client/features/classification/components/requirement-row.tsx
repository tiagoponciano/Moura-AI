import { ChevronDown } from "lucide-react";
import type { SystemView } from "../lib/classify";

/** What IN 5 allows for a system of an existing or recent building, by class (arts. 21, 23 and 25). */
const TREATMENT_TEXT = {
  vital:
    "vital. Exigido conforme as normas em vigor; sem as substituições e isenções do anexo C, só as adequações dele. Para o atestado em edificação existente, comprovar ao menos 50% dos sistemas vitais.",
  indispensable:
    "indispensável. Exigido conforme as normas em vigor; sem as substituições e isenções do anexo C, só as adequações dele ou outras com justificativa do RT. Cabe atestado de regularização.",
  adaptable:
    "adequável. Admitem-se todas as adaptações do anexo C, com as compensações, e outras com justificativa do RT. Cabe atestado de regularização.",
} as const;

/** One system as a panel row: required ones expand to why, pending ones list the missing answers. */
export function RequirementRow({
  system,
  omitMissing = [],
}: {
  system: SystemView;
  /** Missing answers already said for the whole list. */
  omitMissing?: string[];
}) {
  if (system.status === "required") {
    const summary = system.partial
      ? "Exigido em parte do imóvel"
      : system.reasons[0]?.locator;
    return (
      <details className="group rounded-lg transition-colors open:bg-muted/50">
        <summary className="grid cursor-pointer list-none grid-cols-[8px_minmax(0,1fr)_16px] gap-x-3 gap-y-0.5 rounded-lg p-2 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="mt-1.5 size-2 rounded-full bg-primary" />
          <span className="text-sm leading-snug font-medium">
            {system.label}
            {(system.vital || system.treatment === "vital") && (
              <span className="ml-2 text-[10px] font-medium tracking-wider text-primary uppercase">
                vital
              </span>
            )}
          </span>
          <ChevronDown className="mt-0.5 size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          {summary && (
            <span className="col-start-2 text-xs leading-snug text-muted-foreground">
              {summary}
            </span>
          )}
        </summary>
        <div className="flex flex-col gap-2.5 pr-2 pb-3 pl-7 text-[13px] leading-snug">
          {system.reasons.map((reason) => (
            <div key={reason.locator} className="flex flex-col gap-0.5">
              <span className="font-medium">{reason.locator}</span>
              {reason.quote && (
                <span className="text-xs text-muted-foreground">
                  {reason.quote}
                </span>
              )}
            </div>
          ))}
          {system.treatment && (
            <p>
              <span className="font-medium">IN 5:</span>{" "}
              {TREATMENT_TEXT[system.treatment]}
            </p>
          )}
          {system.scopes.length > 0 && (
            <p>
              <span className="font-medium">Limitado a:</span>{" "}
              {system.scopes.join("; ")}
            </p>
          )}
          {system.substitutions.map((substitution) => (
            <p key={substitution.by.join("+")}>
              <span className="font-medium">
                A norma permite substituir por:
              </span>{" "}
              {substitution.by.join(" + ")}
              {substitution.alreadyRequired.length > 0 &&
                ` (já exigido: ${substitution.alreadyRequired.join(", ")})`}
              {substitution.note && (
                <span className="block text-xs text-muted-foreground">
                  {substitution.note}
                </span>
              )}
            </p>
          ))}
          {system.notes.map((note) => (
            <p key={note} className="text-xs text-muted-foreground">
              {note}
            </p>
          ))}
        </div>
      </details>
    );
  }

  const pending = system.status === "needs_info";
  const missing = system.missing.filter(
    (label) => !omitMissing.includes(label),
  );

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
        {system.label}
      </span>
      {pending && missing.length > 0 && (
        <span className="col-start-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          Falta
          {missing.map((label) => (
            <span
              key={label}
              className="rounded bg-muted px-1.5 text-[10px] leading-4 font-medium"
            >
              {label.toLowerCase()}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
