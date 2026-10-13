import type { Database } from "@/lib/supabase/database.types";

export type ChatModule = Database["public"]["Enums"]["chat_module"];

export const CHAT_MODULES = [
  "documents",
  "classification",
] as const satisfies readonly ChatModule[];

/** Flat string pairs saved with a chat and used to filter the history list (e.g. `{ templateId }`). */
export type ChatContext = Record<string, string>;

export type ChatSummary = { id: string; title: string; updatedAt: string };
