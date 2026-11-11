import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { mergeProjectData, type ProjectData } from "../lib/project-fields";
import {
  projectCreateSchema,
  projectIdSchema,
  projectUpdateSchema,
} from "../lib/projects";

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
    .select("id, name, data")
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
    .select("id, name, data")
    .single();
  if (error) return failure("Failed to create the project", error);
  return Response.json({ project: data }, { status: 201 });
}

const invalidId = () =>
  Response.json({ error: "Invalid project id" }, { status: 400 });

const notFound = () =>
  Response.json({ error: "Project not found" }, { status: 404 });

/**
 * `PATCH /api/documents/projects/:id` with `{ name }`, `{ data }` or both:
 * renames the project and/or merges those keys into its data. Reads then
 * writes, so two people saving the same project at once keep the last write of
 * each key they both sent. An archived project answers 404.
 */
export async function handleUpdateProject(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const parsedId = projectIdSchema.safeParse((await params).id);
  if (!parsedId.success) return invalidId();
  const body = await parseJsonBody(req, projectUpdateSchema);
  if (body.error) return body.error;

  const { data: current, error: readError } = await session.supabase
    .from("projects")
    .select("data")
    .eq("id", parsedId.data)
    .is("archived_at", null)
    .maybeSingle();
  if (readError) return failure("Failed to update the project", readError);
  if (!current) return notFound();

  const { data, error } = await session.supabase
    .from("projects")
    .update({
      ...(body.data.name !== undefined && { name: body.data.name }),
      ...(body.data.data && {
        data: mergeProjectData(current.data as ProjectData, body.data.data),
      }),
    })
    .eq("id", parsedId.data)
    .is("archived_at", null)
    .select("id, name, data")
    .maybeSingle();
  if (error) return failure("Failed to update the project", error);
  if (!data) return notFound();
  return Response.json({ project: data });
}

/** `DELETE /api/documents/projects/:id`: archives the project, nothing is deleted. */
export async function handleArchiveProject(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const parsedId = projectIdSchema.safeParse((await params).id);
  if (!parsedId.success) return invalidId();

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
