import { requireUser } from "@/lib/auth/require-user";
import {
  MAX_TEMPLATE_BYTES,
  PPTX_MIME,
  PROPOSAL_TAGS,
  checkProposalTemplate,
} from "../lib/proposal-template";
import {
  PROPOSAL_TEMPLATE_OBJECT,
  loadProposalTemplate,
} from "./template-files";

/** The signed-in admin and their client, or the response that refuses. */
async function requireAdmin() {
  const session = await requireUser("Admin console is not configured");
  if (session.error) return session;
  const { data: isAdmin } = await session.supabase.rpc("is_admin");
  if (!isAdmin) {
    return { error: Response.json({ error: "Admin only" }, { status: 403 }) };
  }
  return session;
}

/** `GET /api/documents/proposal-template`: the uploaded deck, if any, and the tags the app fills. */
export async function handleGetProposalTemplate(): Promise<Response> {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("proposal_template")
    .select("file_name, size_bytes, uploaded_at")
    .maybeSingle();
  if (error) {
    console.error("Failed to read the proposal template", error.message);
    // PGRST205 and 42P01: the table is not there, so the migration was not applied.
    const missing = error.code === "PGRST205" || error.code === "42P01";
    return Response.json(
      {
        error: missing
          ? "A tabela do modelo não existe no banco. Aplique a migration 20261126000100_proposal_template.sql no Supabase."
          : "Failed to load",
      },
      { status: missing ? 503 : 500 },
    );
  }
  return Response.json({
    custom: data
      ? {
          fileName: data.file_name,
          sizeBytes: data.size_bytes,
          uploadedAt: data.uploaded_at,
        }
      : null,
    tags: PROPOSAL_TAGS,
  });
}

/** `GET /api/documents/proposal-template/file`: the deck in use, to edit and upload again. */
export async function handleDownloadProposalTemplate(): Promise<Response> {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const file = await loadProposalTemplate(session.supabase);
  return new Response(file.slice(), {
    headers: {
      "Content-Type": PPTX_MIME,
      "Content-Disposition": "attachment; filename=modelo-proposta.pptx",
    },
  });
}

/** `PUT /api/documents/proposal-template` with a multipart `file`: checks the deck's tags, then keeps it. */
export async function handleSetProposalTemplate(
  req: Request,
): Promise<Response> {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const form = await req.formData().catch(() => undefined);
  const upload = form?.get("file");
  if (!(upload instanceof File)) {
    return Response.json({ error: "Envie um arquivo .pptx" }, { status: 400 });
  }
  if (upload.size > MAX_TEMPLATE_BYTES) {
    return Response.json(
      { error: "O arquivo passa de 20 MB." },
      { status: 400 },
    );
  }
  const file = new Uint8Array(await upload.arrayBuffer());
  const check = checkProposalTemplate(file);
  if (!check.ok) {
    return Response.json(
      { error: check.reason, unknown: check.unknown },
      { status: 400 },
    );
  }

  const { error: storageError } = await session.supabase.storage
    .from("proposal-template")
    .upload(PROPOSAL_TEMPLATE_OBJECT, file, {
      contentType: PPTX_MIME,
      upsert: true,
    });
  if (storageError) {
    console.error("Failed to store the proposal template", storageError);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
  const { error } = await session.supabase.from("proposal_template").upsert({
    id: true,
    file_name: upload.name.slice(0, 255),
    size_bytes: file.byteLength,
    uploaded_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Failed to record the proposal template", error);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}

/** `DELETE /api/documents/proposal-template`: goes back to the deck bundled with the app. */
export async function handleResetProposalTemplate(): Promise<Response> {
  const session = await requireAdmin();
  if (session.error) return session.error;

  const { error } = await session.supabase
    .from("proposal_template")
    .delete()
    .eq("id", true);
  if (error) {
    console.error("Failed to reset the proposal template", error);
    return Response.json({ error: "Failed to reset" }, { status: 500 });
  }
  await session.supabase.storage
    .from("proposal-template")
    .remove([PROPOSAL_TEMPLATE_OBJECT]);
  return new Response(null, { status: 204 });
}
