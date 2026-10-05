import { CircleCheck, CircleHelp } from "lucide-react";
import { BUILDING_FIELD_LABEL } from "../lib/building";
import type { Requirement } from "../lib/evaluate";

/** A required system with its reason and checks, or a system waiting for answers. */
export function RequirementCard({ requirement }: { requirement: Requirement }) {
  const required = requirement.status === "required";

  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4">
      {required ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
      ) : (
        <CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm font-medium">{requirement.system}</p>
        <p className="text-xs text-muted-foreground">
          {required
            ? `Por quê: ${requirement.reason}.`
            : `Depende de: ${requirement.missing
                .map((field) => BUILDING_FIELD_LABEL[field].toLowerCase())
                .join(", ")}.`}
        </p>
        {required && requirement.checks.length > 0 && (
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {requirement.checks.map((check) => (
              <li key={check} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                {check}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
