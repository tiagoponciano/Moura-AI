import { ANNEX_D_NOTES, faultsById } from "../lib/annex-d";

/** The compensatory measures of Annex D of IN 5 for the construction errors the assistant recorded. */
export function CompensatoryMeasures({ faults }: { faults: string[] }) {
  const rows = faultsById(faults);
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      <h2 className="text-sm font-semibold">
        Erros de execução (IN 5, Anexo D)
      </h2>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium">
              {row.system}: {row.fault}
              {!/^n[ãa]o aplic/i.test(row.parameter) && ` (${row.parameter})`}
            </span>
            <span
              className={
                row.refused ? "text-destructive" : "text-muted-foreground"
              }
            >
              {row.measures}
            </span>
          </li>
        ))}
      </ul>
      {ANNEX_D_NOTES.map((note) => (
        <p key={note} className="text-xs text-muted-foreground">
          {note}
        </p>
      ))}
      <p className="text-xs text-muted-foreground">
        Texto da norma, sem leitura própria; não confirmado com a Moura.
      </p>
    </section>
  );
}
