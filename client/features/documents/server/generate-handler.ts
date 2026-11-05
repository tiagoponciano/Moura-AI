import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { validateForDocument } from "../lib/form-values";
import { generateRequestBody } from "../lib/generate-request";
import { documentFileName, renderDocx } from "../lib/render-docx";
import { convertDocxToPdf, isPdfServiceConfigured } from "./pdf-service";
import { loadTemplateFiles } from "./template-files";

const MIME_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

/**
 * `POST /api/documents/generate` with `{ templateId, format, values }`: validates
 * the fields again, renders the official `.docx` and, for a PDF, converts it in
 * the PDF microservice. No model takes part in this.
 */
export async function handleGenerateDocument(req: Request): Promise<Response> {
  const session = await requireUser("Documents are not configured");
  if (session.error) return session.error;

  const body = await parseJsonBody(req, generateRequestBody);
  if (body.error) return body.error;
  const { templateId, format, values } = body.data;

  if (format === "pdf" && !isPdfServiceConfigured()) {
    return Response.json(
      { error: "O serviço de PDF não está configurado. Baixe o .docx." },
      { status: 503 },
    );
  }
  const files = await loadTemplateFiles(templateId);
  if (!files) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }
  const validation = validateForDocument(files.schema, values);
  if (!validation.ok) {
    return Response.json(
      { error: validation.problems.join("; ") },
      { status: 422 },
    );
  }

  const docx = renderDocx(files.docx, files.schema, validation.values);
  let document = docx;
  if (format === "pdf") {
    try {
      document = await convertDocxToPdf(docx);
    } catch (cause) {
      console.error("Failed to convert a document to PDF", cause);
      return Response.json(
        { error: "O serviço de PDF não respondeu. Baixe o .docx." },
        { status: 502 },
      );
    }
  }

  const fileName = documentFileName(files.entry, validation.values, format);
  return new Response(document.slice(), {
    headers: {
      "Content-Type": MIME_TYPES[format],
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
