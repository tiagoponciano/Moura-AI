import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { fillingBody, templateIdSchema } from "../lib/fillings";
import { projectIdSchema } from "@/lib/projects/project";

const failure = (message: string, cause: unknown) => {
  console.error(message, cause);
  return Response.json({ error: message }, { status: 500 });
};

const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });

type IdParams = { params: Promise<{ id: string }> };
type FillingParams = { params: Promise<{ id: string; templateId: string }> };

/** `GET /api/documents/projects/:id/fillings`: what was filled in each form of the project. */
export async function handleListFillings(
  _req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) return badRequest("Invalid project id");

  const { data, error } = await session.supabase
    .from("form_fillings")
    .select("template_id, values, updated_at")
    .eq("project_id", id.data)
    .order("updated_at", { ascending: false });
  if (error) return failure("Failed to load the fillings", error);
  return Response.json({ fillings: data });
}

/** `PUT /api/documents/projects/:id/fillings/:templateId` with `{ values }`: replaces the saved values of that form. */
export async function handleSaveFilling(
  req: Request,
  { params }: FillingParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const { id: rawId, templateId: rawTemplate } = await params;
  const id = projectIdSchema.safeParse(rawId);
  if (!id.success) return badRequest("Invalid project id");
  const templateId = templateIdSchema.safeParse(rawTemplate);
  if (!templateId.success) return badRequest("Invalid template id");

  const body = await parseJsonBody(req, fillingBody);
  if (body.error) return body.error;

  const { error } = await session.supabase.from("form_fillings").upsert({
    project_id: id.data,
    template_id: templateId.data,
    values: body.data.values,
  });
  if (error) return failure("Failed to save the filling", error);
  return new Response(null, { status: 204 });
}
