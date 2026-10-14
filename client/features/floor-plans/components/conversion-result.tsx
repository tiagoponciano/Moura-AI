import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const RESULT_ROWS = ["Escala", "Camadas", "Entidades"] as const;

/** What the conversion will report; empty until the converter exists. */
export function ConversionResult() {
  return (
    <section className="flex flex-col gap-3 border-t px-5 pt-4 pb-4">
      <h2 className="text-sm font-semibold">Resultado</h2>
      <dl className="flex flex-col gap-1.5 text-sm">
        {RESULT_ROWS.map((label) => (
          <div key={label} className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-muted-foreground">—</dd>
          </div>
        ))}
      </dl>
      <Button disabled>
        <Download />
        Baixar DWG
      </Button>
    </section>
  );
}
