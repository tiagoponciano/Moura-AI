import { TriangleAlert } from "lucide-react";

export function ConversionNotice() {
  return (
    <div className="flex gap-2 rounded-md bg-accent px-3 py-2 text-xs leading-relaxed text-accent-foreground">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <span className="font-medium">Conversão em preparação.</span> Já dá para
        enviar e visualizar a planta; a geração do DWG chega quando os critérios
        forem definidos com a Moura.
      </p>
    </div>
  );
}
