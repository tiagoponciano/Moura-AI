import { generateText, Output } from "ai";
import { requireUser } from "@/lib/auth/require-user";
import { consumeChatQuota, resolveChatModel } from "@/lib/llm";
import { checkFloorPlanFile } from "../lib/floor-plan-file";
import { scaleReading } from "../lib/floor-plan-conversion";
import {
  cropsFromDwgService,
  DwgServiceError,
  isDwgServiceConfigured,
} from "./dwg-service";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

const INSTRUCTIONS = `You read the scale of an architectural floor plan from two small crops: the title block and the strip where a scale bar usually sits.
Report the scale denominator only if a scale is written, such as "ESC 1:100" or "Escala 1/50"; that is 100 or 50. Never infer a scale from the size of rooms or from anything that is not text about the scale. If no scale is written, report null.`;

/**
 * `POST /api/floor-plans/scale` (multipart `file`): the scale written on the
 * plan. Only two small crops reach the model, never the whole plan. The answer
 * is `{ scale: number | null, evidence }`; code validates the number.
 */
export async function handleDetectScale(req: Request): Promise<Response> {
  const session = await requireUser("Plantas não estão configuradas");
  if (session.error) return session.error;
  if (!isDwgServiceConfigured()) {
    return error("O serviço de conversão não está configurado.", 503);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("Invalid form data", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return error("Missing file", 400);
  if (checkFloorPlanFile({ mimeType: file.type, sizeBytes: file.size })) {
    return error("Invalid floor plan file", 422);
  }

  const quotaError = await consumeChatQuota();
  if (quotaError) return quotaError;
  const { model, error: modelError } = await resolveChatModel();
  if (modelError) return modelError;

  try {
    const crops = await cropsFromDwgService(file, file.name);
    const { output } = await generateText({
      model,
      instructions: INSTRUCTIONS,
      output: Output.object({ schema: scaleReading }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Crops of the plan: title block, then scale strip.",
            },
            ...crops.map((crop) => ({
              type: "image" as const,
              image: crop.png_base64,
              mediaType: "image/png",
            })),
          ],
        },
      ],
    });
    return Response.json({ scale: output.scale, evidence: output.evidence });
  } catch (cause) {
    console.error("Failed to read the scale of a floor plan", cause);
    if (cause instanceof DwgServiceError) {
      return error("Não foi possível ler a planta agora.", 502);
    }
    return error("Não foi possível ler a escala agora.", 502);
  }
}
