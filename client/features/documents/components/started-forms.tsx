import { FileClock } from "lucide-react";
import type { StartedForm } from "../lib/started-forms";

type StartedFormsProps = {
  forms: StartedForm[];
  onOpen: (templateId: string) => void;
};

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** The forms already filled in the current project, to pick up where they stopped. */
export function StartedForms({ forms, onOpen }: StartedFormsProps) {
  if (forms.length === 0) return null;
  return (
    <section
      aria-label="Formulários já iniciados"
      className="flex flex-col gap-2"
    >
      <h3 className="text-sm font-medium">Já iniciados neste projeto</h3>
      <ul className="flex flex-wrap gap-2">
        {forms.map((form) => (
          <li key={form.templateId}>
            <button
              type="button"
              onClick={() => onOpen(form.templateId)}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-left text-sm transition hover:border-primary focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <FileClock className="size-4 text-primary" />
              <span className="flex flex-col">
                <span>{form.name}</span>
                <span className="text-xs text-muted-foreground">
                  {dateTime.format(new Date(form.updatedAt))}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
