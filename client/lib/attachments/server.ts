import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ATTACHMENTS_BUCKET, checkAttachment, isOwnStoragePath } from "./rules";
import type { Attachment } from "./types";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const createBody = z.object({
  chatId: z.uuid(),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
});

type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error: Response.json(
        { error: "Attachments are not configured" },
        { status: 503 },
      ),
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }
  return { supabase, user };
}

async function withSignedUrls(
  supabase: SupabaseClient<Database>,
  rows: AttachmentRow[],
): Promise<Attachment[]> {
  if (rows.length === 0) return [];
  const { data } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrls(
      rows.map((row) => row.storage_path),
      SIGNED_URL_TTL_SECONDS,
    );
  const urls = new Map(
    (data ?? []).map((entry) => [entry.path, entry.signedUrl]),
  );
  return rows.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    url: urls.get(row.storage_path) ?? null,
  }));
}

/**
 * `POST /api/attachments`: records a file the browser already uploaded to
 * `<userId>/…` in the bucket. Re-checks type, size, folder and that the
 * object exists, so the row never points at a missing or foreign file.
 */
export async function handleCreateAttachment(req: Request): Promise<Response> {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const parsed = createBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid attachment" }, { status: 400 });
  }
  const body = parsed.data;

  const problem = checkAttachment(body);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  if (!isOwnStoragePath(body.storagePath, user.id)) {
    return Response.json(
      { error: "Storage path outside the user's folder" },
      { status: 403 },
    );
  }

  const { data: exists } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .exists(body.storagePath);
  if (!exists) {
    return Response.json({ error: "Uploaded file not found" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("attachments")
    .insert({
      user_id: user.id,
      chat_id: body.chatId,
      storage_path: body.storagePath,
      file_name: body.fileName,
      mime_type: body.mimeType,
      size_bytes: body.sizeBytes,
    })
    .select()
    .single();
  if (error) {
    console.error("Failed to record attachment", error);
    return Response.json(
      { error: "Failed to record attachment" },
      { status: 500 },
    );
  }

  const [attachment] = await withSignedUrls(supabase, [row]);
  return Response.json({ attachment }, { status: 201 });
}

/** `GET /api/attachments?chatId=`: the user's files for one chat, oldest first, with signed URLs. */
export async function handleListAttachments(req: Request): Promise<Response> {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const chatId = z
    .uuid()
    .safeParse(new URL(req.url).searchParams.get("chatId"));
  if (!chatId.success) {
    return Response.json({ error: "Invalid chatId" }, { status: 400 });
  }

  const { data: rows, error } = await supabase
    .from("attachments")
    .select()
    .eq("chat_id", chatId.data)
    .order("created_at");
  if (error) {
    console.error("Failed to list attachments", error);
    return Response.json(
      { error: "Failed to list attachments" },
      { status: 500 },
    );
  }

  return Response.json({ attachments: await withSignedUrls(supabase, rows) });
}
