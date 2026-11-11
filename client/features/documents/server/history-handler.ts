import { requireUser } from "@/lib/auth/require-user";
import { projectIdSchema } from "../lib/projects";

const LIMIT = 100;

/** `GET /api/documents/projects/:id/history`: the latest changes to the project's name and shared data, newest first. */
export async function handleProjectHistory(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const { data, error } = await session.supabase
    .from("project_changes")
    .select("id, field, old_value, new_value, changed_by_name, changed_at")
    .eq("project_id", id.data)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(LIMIT);
  if (error) {
    console.error("Failed to load the project history", error);
    return Response.json(
      { error: "Failed to load the project history" },
      { status: 500 },
    );
  }
  return Response.json({ changes: data });
}
