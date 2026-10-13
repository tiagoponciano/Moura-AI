import { cn } from "@/lib/utils";
import type { Requirement, RequirementGroups } from "../lib/evaluate";
import { RequirementRow } from "./requirement-row";

/** Summary bar segment color for each status. */
const SEGMENT = {
  required: "bg-primary",
  needs_info: "bg-input",
  not_required: "bg-muted",
} satisfies Record<Requirement["status"], string>;

/** Systems summary bar and the systems grouped by status. */
export function RequirementsList({ groups }: { groups: RequirementGroups }) {
  const sections = [
    { title: "Exigidos", items: groups.required },
    { title: "Dependem de respostas", items: groups.needsInfo },
    { title: "Não exigidos", items: groups.notRequired },
  ].filter((section) => section.items.length > 0);
  const ordered = [
    ...groups.required,
    ...groups.needsInfo,
    ...groups.notRequired,
  ];

  return (
    <section className="flex flex-col border-t">
      <div className="flex flex-col gap-2.5 px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <h2 className="font-semibold">Sistemas preventivos</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {groups.required.length} exigidos · {groups.needsInfo.length}{" "}
            pendentes
          </span>
        </div>
        <div
          role="img"
          aria-label={`${groups.required.length} exigidos, ${groups.needsInfo.length} pendentes, ${groups.notRequired.length} não exigidos`}
          className="flex gap-1"
        >
          {ordered.map((requirement) => (
            <span
              key={requirement.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                SEGMENT[requirement.status],
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col">
            <h3 className="px-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {section.title}
            </h3>
            {section.items.map((requirement) => (
              <RequirementRow key={requirement.id} requirement={requirement} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
