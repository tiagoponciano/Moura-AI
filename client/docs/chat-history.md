# Chat history

How conversations are saved and reopened now, for the Documentos and Classificação chats. For developers touching the chat route handlers, the shared `Chat` component or the `chats` tables.

## What this is

Each chat in a module is saved per user in Supabase when a response finishes. The chat header has a "Histórico" menu listing the user's saved chats for that module; picking one reloads its messages, and the module's form is refilled by replaying the tool results in those messages.

Invariants:

- **The browser owns the chat id.** `Chat` creates it with `crypto.randomUUID()` and passes it to `useChat`; the AI SDK transport sends it as `id`. The row is created by the first saved response, not before.
- **Saving never breaks the chat.** When Supabase is not configured, there is no session, or `id` is not a UUID, the handler streams exactly as without history. Save errors are logged, not shown.
- **The response stream stays open until the save finishes.** The AI SDK awaits `onEnd` in the stream's `flush`, so Vercel does not freeze the function mid-write.
- RLS limits every row to its owner, and only approved users (see `authentication.md`).

## Surface

### HTTP

| Method | Path                          | Returns                                                                                                                                                                      |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/chats?module=&context=` | `200 {"chats": ChatSummary[]}`; `400 {"error":"Invalid module or context"}`; `503 {"error":"Chat history is not configured"}`; `500 {"error":"Failed to list chats"}`        |
| `GET`  | `/api/chats/:id`              | `200 {"chat": {...}, "messages": UIMessage[]}`; `404 {"error":"Chat not found"}` (non-UUID id, missing or another user's chat); `503`; `500 {"error":"Failed to load chat"}` |
| `POST` | `/api/documents/chat`         | Saves with `module: "documents"`, `context: { templateId }`                                                                                                                  |
| `POST` | `/api/classification/chat`    | Saves with `module: "classification"`, `context: {}`                                                                                                                         |

All four sit behind the proxy gate (401/403 before reaching the handler). `module` must be `documents` or `classification`. `context` is optional, a URL-encoded JSON object of string values; missing means `{}`.

### Library

| Export                                                 | File                         | Contract                                                                               |
| ------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------- |
| `chatPersistence({chatId, module, context, messages})` | `lib/chat-history/server.ts` | `Promise<ChatPersistence \| undefined>`; pass to `toChatResponse(stream, persistence)` |
| `handleListChats`, `handleGetChat`                     | `lib/chat-history/server.ts` | The two `GET` handlers above                                                           |
| `fetchChats(module, context?)`                         | `lib/chat-history/client.ts` | Browser; throws on non-2xx                                                             |
| `fetchChatMessages(id)`                                | `lib/chat-history/client.ts` | Browser; throws on non-2xx                                                             |
| `deriveChatTitle(messages)`                            | `lib/chat-history/title.ts`  | Rule below                                                                             |
| `parseChatListQuery(params)`                           | `lib/chat-history/query.ts`  | `{ module, context }` or `undefined`                                                   |
| `isChatId(value)`                                      | `lib/chat-history/query.ts`  | `z.uuid()` check                                                                       |
| `formatChatDate(iso)`                                  | `lib/chat-history/format.ts` | `pt-BR`, short date + short time: `13/10/2026, 14:05`                                  |
| `ChatPersistence`, `toChatResponse`                    | `lib/llm.ts`                 | `{ originalMessages, generateMessageId, onEnd }`, spread into `toUIMessageStream`      |

`Chat` (`components/chat/chat.tsx`) takes `history?: { module, context? }`. The menu is `components/chat/chat-history-menu.tsx`.

## Data shapes

```sql
chats (
  id         uuid primary key,          -- the useChat id, generated in the browser
  user_id    uuid not null default auth.uid() references profiles on delete cascade,
  module     chat_module not null,      -- 'documents' | 'classification'
  title      text not null,             -- deriveChatTitle, recomputed on every save
  context    jsonb not null default '{}',  -- documents: {"templateId":"example"}; classification: {}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- set to now() by the app on every save
)
chat_messages (
  chat_id    uuid references chats on delete cascade,
  id         text,                      -- UIMessage.id; primary key is (chat_id, id)
  position   integer not null,          -- 0-based index in the conversation
  role       text not null,             -- 'system' | 'user' | 'assistant'
  message    jsonb not null,            -- the full UIMessage: { id, role, parts, metadata? }
  created_at timestamptz not null default now()
)
```

```jsonc
// GET /api/chats?module=documents&context=%7B%22templateId%22%3A%22example%22%7D
{ "chats": [{ "id": "3b241101-…", "title": "Padaria Silva, 750 m²", "updatedAt": "2026-10-13T17:05:12.345+00:00" }] }

// GET /api/chats/3b241101-…
{
  "chat": { "id": "3b241101-…", "module": "documents", "title": "Padaria Silva, 750 m²",
            "context": { "templateId": "example" }, "updatedAt": "2026-10-13T17:05:12.345+00:00" },
  "messages": [ /* UIMessage[] ordered by position */ ]
}
```

User message ids come from `useChat`; assistant message ids are generated on the server as `msg-` plus 16 random characters.

## Rules and behavior

### Saving (`chatPersistence` → `onEnd`)

1. Return `undefined` (no saving) if `chatId` is not a UUID, Supabase is not configured, or `auth.getUser()` has no user.
2. When the response stream ends, upsert `chats` by `id` with `user_id`, `module`, `context`, `title = deriveChatTitle(all messages)` and `updated_at = now`.
3. If that fails, log `Failed to save chat` and stop; messages are not written.
4. Upsert every message by `(chat_id, id)` with `position` = its index. A failure logs `Failed to save chat messages`.

The messages saved are the ones the browser sent plus the new assistant message, so the stored history is whatever the client held. Messages are only ever upserted, never deleted.

### Title (`deriveChatTitle`)

1. Take the first message with `role: "user"`; join its text parts with a space, collapse whitespace, trim.
2. Empty or no user message → `Nova conversa`.
3. Up to 80 characters → as is. Longer → the first 79 characters, trailing spaces removed, then `…` (80 characters total).

### Listing

Newest `updated_at` first, at most 50, filtered by `module` and `context @> <given context>` (JSON containment). Documents passes `{ templateId }`, so the list shows only chats of the selected template. Classification passes nothing, so it lists all classification chats. The list is fetched every time the menu opens.

### `Chat` component

| Action                     | Effect                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Mount                      | New session: fresh UUID, no messages                                                                                                       |
| "Nova conversa"            | Stops any stream, new UUID, empty messages; disabled while there are no messages. Module form values are kept                              |
| Pick a chat in "Histórico" | Fetches its messages; on success stops any stream, clears the processed-tool-call set and starts `useChat` with that id and those messages |
| Fetch fails                | Shows "Não foi possível abrir a conversa." above the messages; current chat untouched                                                      |

- "Histórico" shows only when `history` is passed **and** `isSupabaseConfigured()`. Both workspaces pass it. It is disabled while a response streams; the current chat is disabled in the list.
- Menu states: "Carregando…", "Não foi possível carregar o histórico.", "Nenhuma conversa salva ainda.", or one item per chat (title + `formatChatDate`).
- Reopening replays every `output-available` tool part through `onToolResult`. Documents merges `fill_fields` values over the current form; Classificação merges `record_building` answers over the current answers. The form is not cleared first.
- The documents `Chat` is keyed by template id, so switching templates starts a new session.

## What this does NOT do

- No delete, rename or search, and no pagination beyond the 50 newest.
- Form values typed by hand are not saved; reopening a chat restores only what the tools extracted.
- Messages loaded from the database are not re-validated against the current tool schemas (`validateUIMessages` is not used). Old `fill_fields` keys that no longer exist in a template are dropped by `pickExtractedValues`.
- Chats are not synced between open tabs; a chat continued in two tabs keeps whichever saved last.
- Attachments are not shown in the list; they reload when the chat opens (see `attachments.md`).

## Gotchas

- **A chat never shows up in "Histórico"** → nothing was saved: no session, user not approved (RLS), Supabase not configured on the server, or a save error. → Check the function logs for `Failed to save chat`; the chat itself shows no error by design.
- **Documents history is empty after switching templates** → the list is filtered by `templateId`. → Switch back to the template the chat was held in.
- **Reopening a documents chat overwrote a manual edit** → replayed `fill_fields` outputs are merged over the current values. → Expected; "Nova conversa" does not reset the form either.
- **`database.types.ts` and the tables disagree** → the types are hand-written. → Regenerate them after changing a migration (see `authentication.md` → Setup).
- **Closing the tab mid-answer** → the stream is cancelled and `onEnd` still runs with the partial assistant message, so a truncated answer may be saved.

## Setup

Same Supabase project and env vars as `authentication.md`; the tables come from `supabase/migrations/20261013000100_chats.sql`.
