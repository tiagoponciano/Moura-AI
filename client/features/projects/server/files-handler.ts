import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import {
  PROJECT_FILES_BUCKET,
  projectFileRecordBody,
} from "@/lib/projects/files";
import { projectIdSchema } from "@/lib/projects/project";
import { z } from "zod";

type IdParams = { params: Promise<{ id: string }> };
type FileParams = { params: Promise<{ id: string; fileId: string }> };

/** How many files the list of a project shows. */
const LIST_LIMIT = 100;

const COLUMNS =
  "id, kind, file_name, mime_type, size_bytes, storage_path, created_at";

const failure = (message: string, cause: unknown) => {
  console.error(message, cause);
  return Response.json({ error: message }, { status: 500 });
};

const invalidId = () =>
  Response.json({ error: "Invalid project id" }, { status: 400 });

/** `GET /api/projects/:id/files`: the files kept for the project, newest first. */
export async function handleListProjectFiles(
  _req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;
  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) return invalidId();

  const { data, error } = await session.supabase
    .from("project_files")
    .select(COLUMNS)
    .eq("project_id", id.data)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) return failure("Failed to load the project files", error);
  return Response.json({ files: data });
}

/**
 * `POST /api/projects/:id/files`: records a file the browser already uploaded to
 * the bucket. The path must start with the project's id.
 */
export async function handleRecordProjectFile(
  req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;
  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) return invalidId();
  const body = await parseJsonBody(req, projectFileRecordBody);
  if (body.error) return body.error;

  const [folder, name, ...rest] = body.data.storagePath.split("/");
  if (folder !== id.data || !name || rest.length > 0) {
    return Response.json(
      { error: "The file is not inside the project's folder" },
      { status: 400 },
    );
  }
  const { data, error } = await session.supabase
    .from("project_files")
    .insert({
      project_id: id.data,
      kind: body.data.kind,
      file_name: body.data.fileName,
      mime_type: body.data.mimeType,
      size_bytes: body.data.sizeBytes,
      storage_path: body.data.storagePath,
    })
    .select(COLUMNS)
    .single();
  if (error) return failure("Failed to save the project file", error);
  return Response.json({ file: data }, { status: 201 });
}

/** `DELETE /api/projects/:id/files/:fileId`: removes the stored object, then the row. */
export async function handleDeleteProjectFile(
  _req: Request,
  { params }: FileParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;
  const { id: rawId, fileId: rawFile } = await params;
  const id = projectIdSchema.safeParse(rawId);
  if (!id.success) return invalidId();
  const fileId = z.uuid().safeParse(rawFile);
  if (!fileId.success) {
    return Response.json({ error: "Invalid file id" }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("project_files")
    .select("storage_path")
    .eq("project_id", id.data)
    .eq("id", fileId.data)
    .maybeSingle();
  if (error) return failure("Failed to find the project file", error);
  if (!data) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const removed = await session.supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .remove([data.storage_path]);
  if (removed.error) {
    return failure("Failed to remove the stored file", removed.error);
  }
  const { error: deleteError } = await session.supabase
    .from("project_files")
    .delete()
    .eq("id", fileId.data);
  if (deleteError)
    return failure("Failed to remove the project file", deleteError);
  return new Response(null, { status: 204 });
}
