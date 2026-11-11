import { z } from "zod";

export type ConversionFormat = "dxf" | "dwg";

/** Quality problems the DWG service reports, in the words shown to the user. */
export const WARNING_MESSAGE: Record<string, string> = {
  blurry: "A imagem está borrada; o resultado pode ser pouco confiável.",
  low_contrast: "O contraste é baixo; linhas fracas podem ter ficado de fora.",
  low_resolution: "A resolução é baixa; envie uma imagem maior, se houver.",
  no_lines_found: "Nenhuma linha foi encontrada na planta.",
};

/** The messages for the codes of an `X-Warnings` header; an unknown code is shown as is. */
export function parseWarnings(header: string | null): string[] {
  return (header ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => WARNING_MESSAGE[code] ?? code);
}

/** "1:100", "1 : 100" or "100" → 100; anything else, or out of 1 to 5000, → undefined. */
export function parseScale(text: string): number | undefined {
  const match = text.trim().match(/^(?:1\s*[:/]\s*)?(\d{1,4})$/);
  if (!match) return undefined;
  const scale = Number(match[1]);
  return scale >= 1 && scale <= 5000 ? scale : undefined;
}

/** What the model returns when it reads the scale from the crops. */
export const scaleReading = z.object({
  scale: z
    .number()
    .int()
    .min(1)
    .max(5000)
    .nullable()
    .describe(
      "The scale denominator: 100 for 1:100. Null when it is not written.",
    ),
  evidence: z.string().max(200).describe("The text or bar that shows it."),
});

export type ConversionResult = {
  blob: Blob;
  fileName: string;
  mode: "vector" | "raster";
  warnings: string[];
};

/** Asks the app to convert the plan; throws with the server's message on failure. */
export async function convertPlan(
  file: File,
  format: ConversionFormat,
  scale: number | undefined,
): Promise<ConversionResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("format", format);
  if (scale) form.append("scale", String(scale));
  const response = await fetch("/api/floor-plans/convert", {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(body?.error ?? "Não foi possível converter a planta.");
  }
  return {
    blob: await response.blob(),
    fileName: `planta.${format}`,
    mode: response.headers.get("x-mode") === "vector" ? "vector" : "raster",
    warnings: parseWarnings(response.headers.get("x-warnings")),
  };
}

/** Asks the app to read the scale from the plan; resolves to the denominator or undefined when it is not found. */
export async function detectScale(file: File): Promise<number | undefined> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/floor-plans/scale", {
    method: "POST",
    body: form,
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.error ?? "Não foi possível ler a escala.");
  }
  return typeof body?.scale === "number" ? body.scale : undefined;
}
