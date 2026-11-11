import { Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { useFloorPlanConversion } from "../hooks/use-floor-plan-conversion";

type ConversionResultProps = {
  hasPlan: boolean;
  conversion: ReturnType<typeof useFloorPlanConversion>;
};

const MODE_LABEL = {
  vector: "PDF vetorial (medidas originais)",
  raster: "Imagem (traçado)",
};

/** The scale, the downloads and what the last conversion reported. */
export function ConversionResult({
  hasPlan,
  conversion,
}: ConversionResultProps) {
  const { busy, outcome } = conversion;
  const disabled = !hasPlan || busy !== undefined || conversion.scaleInvalid;
  return (
    <section className="flex flex-col gap-3 border-t px-5 pt-4 pb-4">
      <h2 className="text-sm font-semibold">Resultado</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plan-scale" className="text-xs">
          Escala do desenho
        </Label>
        <div className="flex gap-2">
          <Input
            id="plan-scale"
            placeholder="1:100"
            value={conversion.scaleText}
            aria-invalid={conversion.scaleInvalid}
            disabled={!hasPlan}
            onChange={(event) => conversion.setScaleText(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!hasPlan || busy !== undefined}
            onClick={conversion.readScale}
          >
            {busy === "scale" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Ler
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Vazio: o desenho sai nas medidas do papel, em milímetros. “Ler” usa a
          IA só em dois recortes pequenos da planta.
        </p>
        {conversion.scaleInvalid && (
          <p role="alert" className="text-xs text-destructive">
            Use o formato 1:100.
          </p>
        )}
      </div>
      {outcome && (
        <dl className="flex flex-col gap-1.5 text-sm">
          <Row label="Origem" value={MODE_LABEL[outcome.mode]} />
          <Row
            label="Escala"
            value={outcome.scale ? `1:${outcome.scale}` : "medidas do papel"}
          />
        </dl>
      )}
      {outcome?.warnings.map((warning) => (
        <p key={warning} role="status" className="text-xs text-destructive">
          {warning}
        </p>
      ))}
      {conversion.notice && (
        <p className="text-xs text-muted-foreground">{conversion.notice}</p>
      )}
      {conversion.error && (
        <p role="alert" className="text-xs text-destructive">
          {conversion.error}
        </p>
      )}
      <div className="flex gap-2">
        {(["dxf", "dwg"] as const).map((format) => (
          <Button
            key={format}
            type="button"
            variant={format === "dxf" ? "default" : "outline"}
            className="flex-1"
            disabled={disabled}
            onClick={() => conversion.convert(format)}
          >
            {busy === format ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            Baixar {format.toUpperCase()}
          </Button>
        ))}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
