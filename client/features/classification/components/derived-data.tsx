import { TriangleAlert } from "lucide-react";
import type { Classification } from "../lib/classify";

/** What the chosen activity set (IN 3, Annex A), where it came from, and when it disagrees with an answer. */
export function DerivedData({
  derived,
  conflicts,
}: Pick<Classification, "derived" | "conflicts">) {
  if (derived.length === 0 && conflicts.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      {derived.length > 0 && (
        <>
          <h2 className="text-sm font-semibold">Da atividade escolhida</h2>
          <dl className="flex flex-col gap-1.5">
            {derived.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium">{item.value}</dd>
                </div>
                <p className="text-xs text-muted-foreground">{item.source}</p>
              </div>
            ))}
          </dl>
        </>
      )}
      {conflicts.map((conflict) => (
        <p
          key={conflict}
          className="flex gap-2 rounded-md bg-accent px-3 py-2 text-xs leading-relaxed text-accent-foreground"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {conflict} Vale a divisão informada.
        </p>
      ))}
    </section>
  );
}
