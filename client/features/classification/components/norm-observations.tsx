import type { Classification } from "../lib/classify";

/** What the norm adds to the result: here, the rules for subsidiary occupations (art. 10). */
export function NormObservations({
  observations,
}: Pick<Classification, "observations">) {
  if (observations.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      <h2 className="text-sm font-semibold">Observações da norma</h2>
      {observations.map((observation) => (
        <div key={observation.text} className="flex flex-col gap-0.5">
          <p className="text-[13px] leading-snug">{observation.text}</p>
          <p className="text-xs text-muted-foreground">{observation.source}</p>
        </div>
      ))}
    </section>
  );
}
