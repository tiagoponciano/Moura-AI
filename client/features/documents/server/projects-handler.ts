import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { z } from "zod";
import { projectCreateSchema, projectUpdateSchema } from "../lib/projects";

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

/**
 * `PATCH /api/documents/projects/:id` with `{ data }`: merges those keys into
 * the project. Reads then writes, so two people saving the same project at once
 * keep the last write of each key they both sent.
 */
export async function handleUpdateProject(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  const body = await parseJsonBody(req, projectUpdateSchema);
  if (body.error) return body.error;

  const { data: current, error: readError } = await session.supabase
    .from("projects")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (readError) return failure("Failed to update the project", readError);
  if (!current) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const { error } = await session.supabase
    .from("projects")
    .update({
      data: { ...(current.data as Record<string, string>), ...body.data.data },
    })
    .eq("id", id);
  if (error) return failure("Failed to update the project", error);
  return new Response(null, { status: 204 });
}
