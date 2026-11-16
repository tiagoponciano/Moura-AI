import type { ProjectFloorPlan } from "../lib/project-floor-plans";

type ProjectPlansProps = {
  /** No project chosen: nothing is kept. */
  hasProject: boolean;
  plans: ProjectFloorPlan[];
  loading: boolean;
  error?: string;
};

const MODE_LABEL = { vector: "vetorial", raster: "imagem" } as const;

const DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** The conversions kept for the project, newest first. */
export function ProjectPlans({
  hasProject,
  plans,
  loading,
  error,
}: ProjectPlansProps) {
  if (!hasProject) return null;
  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      <h2 className="text-sm font-semibold">Plantas do projeto</h2>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          Não foi possível usar as plantas do projeto: {error}
        </p>
      )}
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : plans.length === 0 && !error ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma planta convertida neste projeto ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {plans.map((plan) => (
            <li key={plan.id} className="flex flex-col text-xs">
              <span className="truncate font-medium">{plan.file_name}</span>
              <span className="text-muted-foreground tabular-nums">
                {plan.format.toUpperCase()} · {MODE_LABEL[plan.mode]}
                {plan.scale ? ` · 1:${plan.scale}` : ""} ·{" "}
                {DATE.format(new Date(plan.created_at))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
