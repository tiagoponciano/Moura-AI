import type { RiskView } from "../lib/classify";

/** The risk level I–V, what it means for the process, and the printed source of the decision. */
export function RiskLevel({ risk }: { risk?: RiskView }) {
  if (!risk || risk.status === "not_covered") return null;

  if (risk.status === "pending") {
    return (
      <section className="flex flex-col gap-1 border-t px-5 py-4">
        <h2 className="text-sm font-semibold">Nível de risco</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Depende das respostas que faltam.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        <span>Nível de risco</span>
        <span className="text-base text-primary">Risco {risk.level}</span>
      </h2>
      <p className="text-[13px] leading-snug">{risk.process}</p>
      <p className="text-xs leading-snug text-muted-foreground">
        {risk.reason.locator}
        {risk.reason.quote && ` · ${risk.reason.quote}`}
      </p>
    </section>
  );
}
