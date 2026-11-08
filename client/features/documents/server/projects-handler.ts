import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { projectCreateSchema, projectIdSchema } from "../lib/projects";

const failure = (message: string, cause: unknown) => {
  console.error(message, cause);
  return Response.json({ error: message }, { status: 500 });
};

/** `GET /api/documents/projects`: every project, by name. */
export async function handleListProjects(): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("projects")
    .select("id, name")
    .is("archived_at", null)
    .order("name");
  if (error) return failure("Failed to load projects", error);
  return Response.json({ projects: data });
}

/** `POST /api/documents/projects` with `{ name }`. */
export async function handleCreateProject(req: Request): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const body = await parseJsonBody(req, projectCreateSchema);
  if (body.error) return body.error;

  const { data, error } = await session.supabase
    .from("projects")
    .insert({ name: body.data.name })
    .select("id, name")
    .single();
  if (error) return failure("Failed to create the project", error);
  return Response.json({ project: data }, { status: 201 });
}

const invalidId = () =>
  Response.json({ error: "Invalid project id" }, { status: 400 });

const notFound = () =>
  Response.json({ error: "Project not found" }, { status: 404 });

/** `PATCH /api/documents/projects/[id]` with `{ name }`. */
export async function handleRenameProject(
  req: Request,
  id: string,
): Promise<Response> {
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) return invalidId();

  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const body = await parseJsonBody(req, projectCreateSchema);
  if (body.error) return body.error;

  const { data, error } = await session.supabase
    .from("projects")
    .update({ name: body.data.name })
    .eq("id", parsedId.data)
    .is("archived_at", null)
    .select("id, name")
    .maybeSingle();
  if (error) return failure("Failed to rename the project", error);
  if (!data) return notFound();
  return Response.json({ project: data });
}

/** `DELETE /api/documents/projects/[id]`: archives the project, nothing is deleted. */
export async function handleArchiveProject(id: string): Promise<Response> {
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) return invalidId();

  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error) return failure("Failed to archive the project", error);
  if (!data) return notFound();
  return new Response(null, { status: 204 });
}
