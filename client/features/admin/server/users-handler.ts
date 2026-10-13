import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import type { AdminUser, AdminUsersResponse } from "../lib/types";
import { sortUsers, userUpdateSchema } from "../lib/validation";
import { requireSession, rpcErrorResponse } from "./respond";

/** `GET /api/admin/users`: every profile, pending first. */
export async function handleListUsers(): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("profiles")
    .select(
      "id, email, name, avatar_url, status, role, approved_at, created_at",
    );
  if (error) return rpcErrorResponse(error, "Failed to list users");

  const users: AdminUser[] = data.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    status: row.status,
    role: row.role,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  }));
  const body: AdminUsersResponse = {
    users: sortUsers(users),
    currentUserId: session.user.id,
  };
  return Response.json(body);
}

/**
 * `PATCH /api/admin/users/:id` with `{ status?, role? }`. Status is applied
 * before role; if the role change fails, the status change stays.
 */
export async function handleUpdateUser(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }
  const body = await parseJsonBody(req, userUpdateSchema);
  if (body.error) return body.error;

  if (body.data.status) {
    const { error } = await session.supabase.rpc("admin_set_user_status", {
      target: id,
      new_status: body.data.status,
    });
    if (error) return rpcErrorResponse(error, "Failed to update user");
  }
  if (body.data.role) {
    const { error } = await session.supabase.rpc("admin_set_user_role", {
      target: id,
      new_role: body.data.role,
    });
    if (error) return rpcErrorResponse(error, "Failed to update user");
  }
  return new Response(null, { status: 204 });
}
