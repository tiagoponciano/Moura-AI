import type { Classification } from "../lib/classify";

/** What the assistant will ask next, and what only a professional can answer. */
export function NextQuestions({
  classification,
}: {
  classification: Classification;
}) {
  const { nextQuestions, next, declaredUnknown, status } = classification;
  if (status === "analysis") return null;
  if (!next && declaredUnknown.length === 0) return null;
  const rest = nextQuestions.filter((q) => !next?.facts.includes(q.fact));

  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      {next && (
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Próxima pergunta</h2>
          <p className="text-[13px] leading-snug">{next.ask}</p>
          {rest.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Depois: {rest.map((q) => q.label.toLowerCase()).join(", ")}.
            </p>
          )}
        </div>
      )}
      {declaredUnknown.length > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Pendente de profissional habilitado:
          </span>{" "}
          {declaredUnknown.map((q) => q.label.toLowerCase()).join(", ")}. O
          resultado fica incompleto até alguém informar.
        </p>
      )}
    </section>
  );
}
