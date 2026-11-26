import { type Project } from "@/lib/projects/project";
import { proposalParties } from "../lib/proposal";

/** The project data that goes on the cover, read-only; it is edited in "Dados do projeto". */
export function ProposalSummary({ project }: { project: Project }) {
  const parties = proposalParties(project);
  const rows = [
    ["Cliente", parties.client],
    ["Empreendimento", parties.projectName],
    ["Município", parties.city],
  ] as const;

  return (
    <section aria-label="Dados da capa" className="grid gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">
        Na capa (do projeto)
      </h3>
      <dl className="grid gap-1.5 rounded-lg border p-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate text-right font-medium">
              {value || (
                <span className="font-normal text-muted-foreground">
                  Não preenchido
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        Para mudar, edite na aba Dados do projeto.
      </p>
    </section>
  );
}
