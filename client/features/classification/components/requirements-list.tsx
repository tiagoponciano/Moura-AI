import { cn } from "@/lib/utils";
import type { Classification, SystemView } from "../lib/classify";
import { RequirementRow } from "./requirement-row";

/** Summary bar segment color for each status. */
const SEGMENT = {
  required: "bg-primary",
  needs_info: "bg-input",
  not_required: "bg-muted",
} satisfies Record<SystemView["status"], string>;

/** Systems summary bar and the systems grouped by status. */
export function RequirementsList({
  classification,
}: {
  classification: Classification;
}) {
  const { groups, table, progress, status } = classification;
  const sections = [
    { title: "Exigidos", items: groups.required },
    { title: "Dependem de respostas", items: groups.needsInfo },
    { title: "Não exigidos", items: groups.notRequired },
  ].filter((section) => section.items.length > 0);
  // What every pending system waits for is said once; a row names only what is its own.
  const common =
    groups.needsInfo.length > 1
      ? groups.needsInfo[0].missing.filter((label) =>
          groups.needsInfo.every((s) => s.missing.includes(label)),
        )
      : [];
  const ordered = [
    ...groups.required,
    ...groups.needsInfo,
    ...groups.notRequired,
  ];

  if (status === "analysis") return null;

  if (progress.answered === 0) {
    return (
      <section className="flex flex-col gap-1 border-t px-5 py-4">
        <h2 className="text-sm font-semibold">Sistemas preventivos</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Responda às perguntas, aqui ou na conversa, para ver os sistemas
          exigidos e de onde cada um vem na norma.
        </p>
      </section>
    );
  }

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
        {table && (
          <p className="text-xs text-muted-foreground">Aplicando: {table}</p>
        )}
        <div
          role="img"
          aria-label={`${groups.required.length} exigidos, ${groups.needsInfo.length} pendentes, ${groups.notRequired.length} não exigidos`}
          className="flex gap-1"
        >
          {ordered.map((system) => (
            <span
              key={system.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                SEGMENT[system.status],
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
            {section.title === "Dependem de respostas" && common.length > 0 && (
              <p className="px-2 pb-1.5 text-xs leading-snug text-muted-foreground">
                Todos aguardam: {common.map((l) => l.toLowerCase()).join(", ")}.
              </p>
            )}
            {section.items.map((system) => (
              <RequirementRow
                key={system.id}
                system={system}
                omitMissing={common}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
