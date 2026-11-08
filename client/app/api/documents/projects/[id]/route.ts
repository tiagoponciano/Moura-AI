import {
  handleArchiveProject,
  handleRenameProject,
} from "@/features/documents/server";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/documents/projects/[id]">,
) {
  const { id } = await ctx.params;
  return handleRenameProject(req, id);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/documents/projects/[id]">,
) {
  const { id } = await ctx.params;
  return handleArchiveProject(id);
}
