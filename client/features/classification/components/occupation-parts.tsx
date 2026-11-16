import { divisionLabel } from "../lib/catalog/occupations";
import { mixedKind } from "../lib/mixed-parts";
import type { OccupationPart, Separation } from "../lib/mixed-occupancy";

const SEPARATION_LABEL: Record<Separation, string> = {
  isolated: "isolada",
  compartmented: "compartimentada",
  open: "aberta",
};

const KIND_TEXT = {
  mixed:
    "Ocupação mista (art. 11): as áreas secundárias passam de 10% da edificação.",
  secondary:
    "Ocupações secundárias (art. 12): as áreas secundárias não passam de 10% da edificação.",
};

/** The occupations of a mixed building, as the assistant recorded them. */
export function OccupationParts({ parts }: { parts: OccupationPart[] }) {
  if (parts.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      <h2 className="text-sm font-semibold">Ocupações da edificação</h2>
      <ul className="flex flex-col gap-1.5">
        {parts.map((part, index) => (
          <li key={`${part.division}-${index}`} className="text-xs">
            <span className="font-medium">{divisionLabel(part.division)}</span>
            {index === 0 && (
              <span className="text-muted-foreground"> (predominante)</span>
            )}
            <span className="block text-muted-foreground tabular-nums">
              {part.area_m2.toLocaleString("pt-BR")} m², último piso a{" "}
              {part.top_height_m.toLocaleString("pt-BR")} m, {part.storeys}{" "}
              {part.storeys === 1 ? "pavimento" : "pavimentos"},{" "}
              {SEPARATION_LABEL[part.separation]}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {KIND_TEXT[mixedKind(parts)]} Leitura provisória, ainda não confirmada
        com a Moura.
      </p>
    </section>
  );
}
