import { createIdGenerator, type UIMessage } from "ai";
import type { ChatPersistence } from "@/lib/llm";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isChatId, parseChatListQuery } from "./query";
import { deriveChatTitle } from "./title";
import type { ChatContext, ChatModule, ChatSummary } from "./types";

const HISTORY_LIMIT = 50;

const notConfigured = () =>
  Response.json({ error: "Chat history is not configured" }, { status: 503 });

type PersistenceInput = {
  /** The `id` the AI SDK transport sends: the useChat id. */
  chatId: unknown;
  module: ChatModule;
  context: ChatContext;
  messages: UIMessage[];
};

/**
 * Server-only. Persistence hooks for `toChatResponse`, or `undefined` (the
 * chat still works, unsaved) when Supabase is not configured, there is no
 * session, or the chat id is not a UUID. Save failures are logged, never
 * surfaced to the chat.
 */
export async function chatPersistence({
  chatId,
  module,
  context,
  messages,
}: PersistenceInput): Promise<ChatPersistence | undefined> {
  if (!isChatId(chatId)) return undefined;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;

  return {
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    onEnd: async ({ messages: all }) => {
      const { error: chatError } = await supabase.from("chats").upsert({
        id: chatId,
        user_id: user.id,
        module,
        title: deriveChatTitle(all),
        context,
        updated_at: new Date().toISOString(),
      });
      if (chatError) {
        console.error("Failed to save chat", chatError);
        return;
      }

      const { error } = await supabase.from("chat_messages").upsert(
        all.map((message, position) => ({
          chat_id: chatId,
          id: message.id,
          position,
          role: message.role,
          message: message as unknown as Json,
        })),
        { onConflict: "chat_id,id" },
      );
      if (error) console.error("Failed to save chat messages", error);
    },
  };
}

/** `GET /api/chats?module=&context=`: the user's latest chats, newest first. */
export async function handleListChats(req: Request): Promise<Response> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notConfigured();

  const query = parseChatListQuery(new URL(req.url).searchParams);
  if (!query) {
    return Response.json(
      { error: "Invalid module or context" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, updated_at")
    .eq("module", query.module)
    .contains("context", query.context)
    .order("updated_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) {
    console.error("Failed to list chats", error);
    return Response.json({ error: "Failed to list chats" }, { status: 500 });
  }

  const chats: ChatSummary[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }));
  return Response.json({ chats });
}

/** `GET /api/chats/:id`: one of the user's chats with its messages in order. */
export async function handleGetChat(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notConfigured();

  const { id } = await params;
  const notFound = Response.json({ error: "Chat not found" }, { status: 404 });
  if (!isChatId(id)) return notFound;

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id, module, title, context, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (chatError) {
    console.error("Failed to load chat", chatError);
    return Response.json({ error: "Failed to load chat" }, { status: 500 });
  }
  if (!chat) return notFound;

  const { data: rows, error } = await supabase
    .from("chat_messages")
    .select("message")
    .eq("chat_id", id)
    .order("position");
  if (error) {
    console.error("Failed to load chat messages", error);
    return Response.json({ error: "Failed to load chat" }, { status: 500 });
  }

  return Response.json({
    chat: {
      id: chat.id,
      module: chat.module,
      title: chat.title,
      context: chat.context,
      updatedAt: chat.updated_at,
    },
    messages: rows.map((row) => row.message),
  });
}
