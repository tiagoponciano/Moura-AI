import type { Requirement, RequirementStatus } from "../lib/evaluate";
import { RequirementCard } from "./requirement-card";

const GROUPS: { status: RequirementStatus; title: string }[] = [
  { status: "required", title: "Sistemas exigidos" },
  { status: "needs_info", title: "Dependem de mais informações" },
];

/** Requirements grouped by status; systems not required are listed by name only. */
export function RequirementsList({
  requirements,
}: {
  requirements: Requirement[];
}) {
  const notRequired = requirements.filter((r) => r.status === "not_required");

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map(({ status, title }) => {
        const items = requirements.filter((r) => r.status === status);
        if (items.length === 0) return null;
        return (
          <section key={status} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">
              {title}{" "}
              <span className="text-muted-foreground tabular-nums">
                ({items.length})
              </span>
            </h2>
            <ul className="grid gap-2 lg:grid-cols-2">
              {items.map((requirement) => (
                <RequirementCard
                  key={requirement.id}
                  requirement={requirement}
                />
              ))}
            </ul>
          </section>
        );
      })}
      {notRequired.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium text-muted-foreground">
            Não exigidos ({notRequired.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            {notRequired.map((r) => r.system).join(" · ")}
          </p>
        </section>
      )}
    </div>
  );
}
