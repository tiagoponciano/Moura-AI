import { requireUser } from "@/lib/auth/require-user";
import { pendingGroups, reportHtml } from "../lib/ppci-report";
import { projectIdSchema } from "../lib/projects";
import { convertHtmlToPdf, isPdfServiceConfigured } from "./pdf-service";
import { failure, loadChecklist } from "./ppci-handler";

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/**
 * `GET /api/documents/projects/:id/ppci/report`: a PDF with the items answered
 * "Adequar", by group, for the drafter. No model takes part in this.
 */
export async function handlePpciReport(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  if (!isPdfServiceConfigured()) {
    return Response.json(
      { error: "O serviço de PDF não está configurado." },
      { status: 503 },
    );
  }

  const { data: project, error } = await session.supabase
    .from("projects")
    .select("name, data")
    .eq("id", id.data)
    .is("archived_at", null)
    .maybeSingle();
  if (error) return failure("Failed to load the project", error);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  const loaded = await loadChecklist(session.supabase, id.data);
  if ("error" in loaded) return loaded.error;

  const data = (project.data ?? {}) as Record<string, string | undefined>;
  const html = reportHtml(
    {
      projectName: project.name,
      technicalName: data.technical_name,
      technicalRegistry: data.technical_registry,
      date: date.format(new Date()),
    },
    pendingGroups(loaded.checklist.groups, loaded.checklist.answers),
  );

  try {
    const pdf = await convertHtmlToPdf(html);
    return new Response(pdf.slice(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("pendencias-ppci.pdf")}`,
      },
    });
  } catch (cause) {
    console.error("Failed to convert the PPCI report to PDF", cause);
    return Response.json(
      { error: "O serviço de PDF não respondeu." },
      { status: 502 },
    );
  }
}
