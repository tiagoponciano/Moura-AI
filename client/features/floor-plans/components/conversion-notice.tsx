import { TriangleAlert } from "lucide-react";

export function ConversionNotice() {
  return (
    <div className="flex gap-2 rounded-md bg-accent px-3 py-2 text-xs leading-relaxed text-accent-foreground">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <span className="font-medium">Versão de testes.</span> O desenho sai com
        linhas e textos em uma só camada; confira no CAD antes de usar. O DXF é
        o arquivo mais confiável.
      </p>
    </div>
  );
}
