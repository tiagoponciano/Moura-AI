import { Info } from "lucide-react";
import type { Classification } from "../lib/classify";

/** Why no system is listed: the rules stop at a case the norm leaves to a specific analysis. */
export function AnalysisNotice({
  analyses,
}: {
  analyses: Classification["analyses"];
}) {
  if (analyses.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 border-t px-5 py-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Info className="size-4 text-primary" />
        Caso para análise específica
      </h2>
      {analyses.map((analysis) => (
        <div
          key={analysis.locator + analysis.reason}
          className="flex flex-col gap-1 text-[13px] leading-snug"
        >
          <p>{analysis.reason}</p>
          <p className="text-xs text-muted-foreground">
            Fonte: {analysis.locator}
            {analysis.quote && ` · ${analysis.quote}`}
          </p>
        </div>
      ))}
    </section>
  );
}
