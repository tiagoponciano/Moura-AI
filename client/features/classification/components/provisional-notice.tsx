import { TriangleAlert } from "lucide-react";

export function ProvisionalNotice() {
  return (
    <div className="flex gap-2 rounded-md bg-accent px-3 py-2 text-xs leading-relaxed text-accent-foreground">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <span className="font-medium">Regras provisórias.</span> Lidas das
        Tabelas 2 e 5 da IN 1 parte 2, ainda sem validação da Moura. Só vale
        para o Grupo C (comércio); não use em projeto real até a validação.
      </p>
    </div>
  );
}
