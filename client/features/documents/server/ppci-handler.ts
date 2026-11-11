import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  answerBody,
  buildGroups,
  type ChecklistResponse,
} from "../lib/ppci-answers";
import { projectIdSchema } from "../lib/projects";

export const failure = (message: string, cause: unknown) => {
  console.error(message, cause);
  return Response.json({ error: message }, { status: 500 });
};

type IdParams = { params: Promise<{ id: string }> };

type ServerClient = NonNullable<
  Awaited<ReturnType<typeof createSupabaseServerClient>>
>;

/** The newest checklist and a project's answers to it, or the response to send instead. */
export async function loadChecklist(
  supabase: ServerClient,
  projectId: string,
): Promise<{ checklist: ChecklistResponse } | { error: Response }> {
  const { data: latest, error: versionError } = await supabase
    .from("ppci_checklists")
    .select("version")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) {
    return { error: failure("Failed to load the checklist", versionError) };
  }
  if (!latest) {
    return {
      error: Response.json({ error: "No checklist imported" }, { status: 404 }),
    };
  }
  const version = latest.version;

  const [groups, items, answers] = await Promise.all([
    supabase
      .from("ppci_checklist_groups")
      .select("position, name")
      .eq("checklist_version", version),
    supabase
      .from("ppci_checklist_items")
      .select("group_position, position, section, text, reference")
      .eq("checklist_version", version),
    supabase
      .from("ppci_answers")
      .select(
        "group_position, item_position, status, note, updated_by_name, updated_at",
      )
      .eq("project_id", projectId)
      .eq("checklist_version", version),
  ]);
  const failed = groups.error ?? items.error ?? answers.error;
  if (failed) return { error: failure("Failed to load the checklist", failed) };

  return {
    checklist: {
      version,
      groups: buildGroups(groups.data ?? [], items.data ?? []),
      answers: answers.data ?? [],
    },
  };
}

/** `GET /api/documents/projects/:id/ppci`: the newest checklist and this project's answers. */
export async function handleGetPpci(
  _req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const loaded = await loadChecklist(session.supabase, id.data);
  return "error" in loaded ? loaded.error : Response.json(loaded.checklist);
}

/** `PUT /api/documents/projects/:id/ppci` with one item's answer; a null status clears it. */
export async function handleSaveAnswer(
  req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const body = await parseJsonBody(req, answerBody);
  if (body.error) return body.error;

  const { error } = await session.supabase.from("ppci_answers").upsert({
    project_id: id.data,
    checklist_version: body.data.version,
    group_position: body.data.groupPosition,
    item_position: body.data.itemPosition,
    status: body.data.status,
    note: body.data.note || null,
  });
  if (error) return failure("Failed to save the answer", error);
  return new Response(null, { status: 204 });
}
