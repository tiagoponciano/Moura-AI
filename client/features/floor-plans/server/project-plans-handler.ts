import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { projectIdSchema } from "@/lib/projects/project";
import { conversionRecordBody } from "../lib/project-floor-plans";

type IdParams = { params: Promise<{ id: string }> };

/** How many conversions the list of a project shows. */
const LIST_LIMIT = 20;

const COLUMNS = "id, file_name, mode, scale, format, created_at";

const failure = (message: string, cause: unknown) => {
  console.error(message, cause);
  return Response.json({ error: message }, { status: 500 });
};

/** `GET /api/floor-plans/projects/:id`: the latest conversions kept for the project, newest first. */
export async function handleListProjectPlans(
  _req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const { data, error } = await session.supabase
    .from("project_floor_plans")
    .select(COLUMNS)
    .eq("project_id", id.data)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) return failure("Failed to load the floor plans", error);
  return Response.json({ plans: data });
}

/** `POST /api/floor-plans/projects/:id` with `{ fileName, mode, scale?, format }`: keeps a conversion for the project. */
export async function handleRecordProjectPlan(
  req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const body = await parseJsonBody(req, conversionRecordBody);
  if (body.error) return body.error;

  const { data, error } = await session.supabase
    .from("project_floor_plans")
    .insert({
      project_id: id.data,
      file_name: body.data.fileName,
      mode: body.data.mode,
      scale: body.data.scale ?? null,
      format: body.data.format,
    })
    .select(COLUMNS)
    .single();
  if (error) return failure("Failed to save the floor plan", error);
  return Response.json({ plan: data }, { status: 201 });
}
