import { requireUser } from "@/lib/auth/require-user";
import { ATTACHMENT_MAX_BYTES } from "@/lib/attachments/rules";
import { checkFloorPlanFile } from "../lib/floor-plan-file";
import { parseScale } from "../lib/floor-plan-conversion";
import { planToDxf } from "../lib/plan-dxf";
import { scalePlan } from "../lib/plan-geometry";
import { readVectorPdf } from "../lib/vector-pdf";
import {
  convertWithDwgService,
  DwgServiceError,
  isDwgServiceConfigured,
} from "./dwg-service";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

const attachment = (format: "dxf" | "dwg") =>
  `attachment; filename*=UTF-8''${encodeURIComponent(`planta.${format}`)}`;

/** The service is needed for what the app cannot do itself; the message says which. */
const serviceMissing = (format: "dxf" | "dwg") =>
  error(
    format === "dwg"
      ? "A conversão para DWG precisa do serviço de conversão, que não está configurado. Baixe o DXF."
      : "Esta planta não tem linhas vetoriais (é uma imagem ou um PDF escaneado) e precisa do serviço de conversão, que não está configurado.",
    503,
  );

/**
 * `POST /api/floor-plans/convert` (multipart `file`, `format` = `dxf` | `dwg`,
 * optional `scale`): the plan as DXF or DWG. A vector PDF to DXF is converted
 * here; DWG, images and scanned PDFs go to the DWG service, whose `X-Mode` and
 * `X-Warnings` headers are passed on. No model takes part.
 */
export async function handleConvertFloorPlan(req: Request): Promise<Response> {
  const session = await requireUser("Plantas não estão configuradas");
  if (session.error) return session.error;

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

  if (format === "dxf" && file.type === "application/pdf") {
    let plan;
    try {
      plan = await readVectorPdf(new Uint8Array(await file.arrayBuffer()));
    } catch (cause) {
      console.error("Failed to read a floor plan PDF", cause);
      return error("Não foi possível ler este PDF.", 422);
    }
    if (plan) {
      return new Response(planToDxf(scalePlan(plan, scale)), {
        headers: {
          "Content-Type": "application/dxf",
          "Content-Disposition": attachment(format),
          "X-Mode": "vector",
          "X-Warnings": "",
        },
      });
    }
  }

  if (!isDwgServiceConfigured()) return serviceMissing(format);
  try {
    const answer = await convertWithDwgService(file, file.name, format, scale);
    return new Response(await answer.arrayBuffer(), {
      headers: {
        "Content-Type":
          answer.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": attachment(format),
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
