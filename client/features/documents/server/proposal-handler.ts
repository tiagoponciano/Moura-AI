import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import type { ProjectData } from "../lib/project-fields";
import { projectIdSchema } from "../lib/projects";
import { proposalBody, proposalValues } from "../lib/proposal";
import { convertPptxToPdf, isPdfServiceConfigured } from "./pdf-service";
import { isPptxServiceConfigured, renderProposal } from "./pptx-service";

const MIME_TYPES = {
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
};

/**
 * `POST /api/documents/projects/:id/proposal` with `{ planId, price, validityDays?, format }`:
 * builds the proposal values from the project's shared data and the choices
 * made, has the PPTX service fill the deck and, for a PDF, converts it in the
 * PDF service. No model takes part in this.
 */
export async function handleProposal(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const body = await parseJsonBody(req, proposalBody);
  if (body.error) return body.error;
  const { format } = body.data;

  if (!isPptxServiceConfigured()) {
    return Response.json(
      { error: "O serviço de propostas não está configurado." },
      { status: 503 },
    );
  }
  if (format === "pdf" && !isPdfServiceConfigured()) {
    return Response.json(
      { error: "O serviço de PDF não está configurado. Baixe o .pptx." },
      { status: 503 },
    );
  }

  const { data: project, error } = await session.supabase
    .from("projects")
    .select("name, data")
    .eq("id", id.data)
    .is("archived_at", null)
    .maybeSingle();
  if (error) {
    console.error("Failed to load the project for a proposal", error);
    return Response.json(
      { error: "Failed to load the project" },
      { status: 500 },
    );
  }
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  let file: Uint8Array;
  try {
    file = await renderProposal(
      proposalValues(
        { name: project.name, data: (project.data ?? {}) as ProjectData },
        body.data,
        new Date(),
      ),
    );
    if (format === "pdf") file = await convertPptxToPdf(file);
  } catch (cause) {
    console.error("Failed to generate the proposal", cause);
    return Response.json(
      { error: "Não foi possível gerar a proposta agora." },
      { status: 502 },
    );
  }

  return new Response(file.slice(), {
    headers: {
      "Content-Type": MIME_TYPES[format],
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`proposta.${format}`)}`,
    },
  });
}
