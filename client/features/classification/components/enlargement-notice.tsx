import { IN5_GENERAL_NOTES } from "../lib/enlargement";
import {
  enlargementFor,
  type EnlargementAnswers,
} from "../lib/enlargement-input";
import type { Facts } from "../lib/engine/types";

type EnlargementNoticeProps = {
  answers: Facts;
  enlargement?: EnlargementAnswers;
};

/** How the enlargement of an existing building is regularized, once the assistant recorded it. */
export function EnlargementNotice({
  answers,
  enlargement,
}: EnlargementNoticeProps) {
  if (!enlargement) return null;
  const result = enlargementFor(answers, enlargement);
  return (
    <section className="flex flex-col gap-2 border-t px-5 py-4">
      <h2 className="text-sm font-semibold">
        {enlargement.addedAreaM2 === 0
          ? "Mudança sem ampliação"
          : "Ampliação da edificação"}
      </h2>
      {result ? (
        <>
          <p className="text-xs text-muted-foreground tabular-nums">
            {enlargement.addedAreaM2 > 0 && (
              <>
                {enlargement.addedAreaM2.toLocaleString("pt-BR")} m² sobre{" "}
                {enlargement.originalAreaM2.toLocaleString("pt-BR")} m² (
                {(result.ratio * 100).toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}
                %) ·{" "}
              </>
            )}
            IN 5, {result.articles.join("; ")}
          </p>
          <dl className="flex flex-col gap-1.5 text-xs">
            <div>
              <dt className="font-medium">Área original</dt>
              <dd className="text-muted-foreground">{result.original}</dd>
            </div>
            <div>
              <dt className="font-medium">
                {enlargement.addedAreaM2 === 0 ? "Alteração" : "Área ampliada"}
              </dt>
              <dd className="text-muted-foreground">{result.enlarged}</dd>
            </div>
          </dl>
          {result.notes.map((note) => (
            <p key={note} className="text-xs text-muted-foreground">
              {note}
            </p>
          ))}
          {IN5_GENERAL_NOTES.map((note) => (
            <p key={note} className="text-xs text-muted-foreground">
              {note}
            </p>
          ))}
          <p className="text-xs text-muted-foreground">
            Leitura provisória, ainda não confirmada com a Moura.
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Informe a atividade do imóvel para ver como a ampliação é
          regularizada.
        </p>
      )}
    </section>
  );
}
