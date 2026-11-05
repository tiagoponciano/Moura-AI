import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { projectCreateSchema } from "../lib/projects";

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
