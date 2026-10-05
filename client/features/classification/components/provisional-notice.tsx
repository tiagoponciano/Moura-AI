import { TriangleAlert } from "lucide-react";

export function ProvisionalNotice() {
  return (
    <div className="flex gap-2.5 rounded-xl border border-primary/30 bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-medium">
          Regras provisórias, só para demonstração.
        </span>{" "}
        Os limites ainda não vêm das Instruções Normativas do CBMSC. Não use
        este resultado em projeto real até a validação com a Moura.
      </p>
    </div>
  );
}
