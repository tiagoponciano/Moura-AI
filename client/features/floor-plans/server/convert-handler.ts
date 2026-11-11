import { requireUser } from "@/lib/auth/require-user";
import { ATTACHMENT_MAX_BYTES } from "@/lib/attachments/rules";
import { checkFloorPlanFile } from "../lib/floor-plan-file";
import { parseScale } from "../lib/floor-plan-conversion";
import {
  convertWithDwgService,
  DwgServiceError,
  isDwgServiceConfigured,
} from "./dwg-service";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * `POST /api/floor-plans/convert` (multipart `file`, `format` = `dxf` | `dwg`,
 * optional `scale`): the plan converted by the DWG service. No model takes
 * part. The service's `X-Mode` and `X-Warnings` headers are passed on.
 */
export async function handleConvertFloorPlan(req: Request): Promise<Response> {
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
  const format = form.get("format");
  if (!(file instanceof File)) return error("Missing file", 400);
  if (format !== "dxf" && format !== "dwg") return error("Invalid format", 400);

  const problem = checkFloorPlanFile({
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (problem) return error("Invalid floor plan file", 422);
  if (file.size > ATTACHMENT_MAX_BYTES) return error("File too large", 413);

  const rawScale = form.get("scale");
  const scale = rawScale === null ? 1 : parseScale(String(rawScale));
  if (scale === undefined) return error("Invalid scale", 400);

  try {
    const answer = await convertWithDwgService(file, file.name, format, scale);
    return new Response(await answer.arrayBuffer(), {
      headers: {
        "Content-Type":
          answer.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`planta.${format}`)}`,
        "X-Mode": answer.headers.get("x-mode") ?? "raster",
        "X-Warnings": answer.headers.get("x-warnings") ?? "",
      },
    });
  } catch (cause) {
    console.error("Failed to convert a floor plan", cause);
    if (cause instanceof DwgServiceError && cause.status === 501) {
      return error(
        "A conversão para DWG não está disponível. Baixe o DXF.",
        501,
      );
    }
    return error("Não foi possível converter a planta agora.", 502);
  }
}
