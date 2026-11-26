import { Button } from "@/components/ui/button";
import { normLabel, type ConsultedNorm } from "../lib/consulted-norms";

export type NormsToCheckProps = {
  norms: ConsultedNorm[];
  onConfirm: (key: string) => void;
  /** The passage does not match the norm: the assistant is asked to search again. */
  onReject: (key: string) => void;
};

/** The norm passages the assistant read in this chat, each to be confirmed or sent back. */
export function NormsToCheck({
  norms,
  onConfirm,
  onReject,
}: NormsToCheckProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="font-medium">Normas consultadas</p>
        <p className="text-xs text-muted-foreground">
          Confira cada trecho com a norma. Se não conferir, o assistente busca
          de novo com outras palavras.
        </p>
      </div>
      {norms.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          O assistente não consultou nenhuma norma nesta conversa.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {norms.map((norm) => (
            <li
              key={norm.key}
              className="flex flex-col gap-2 rounded-md border p-3 data-[confirmed=true]:border-success/50"
              data-confirmed={norm.confirmed}
            >
              <div>
                <p className="font-medium">{normLabel(norm)}</p>
                <p className="text-xs text-muted-foreground">{norm.excerpt}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={norm.confirmed ? "default" : "outline"}
                  aria-pressed={norm.confirmed}
                  onClick={() => onConfirm(norm.key)}
                >
                  Confere
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(norm.key)}
                >
                  Não confere
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
