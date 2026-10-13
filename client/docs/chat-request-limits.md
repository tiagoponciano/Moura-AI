# Chat request limits

What the chat routes accept and how often: the per-user quota, the body and message checks that run before the model is called, and how model errors reach the user. It describes how the routes behave now, for developers changing a chat route or debugging a 400, 413 or 429.

## What this is

`POST /api/documents/chat` and `POST /api/classification/chat` call a paid LLM with the key saved on `/admin` (see `llm-configuration.md`), so every request is checked before the model is reached. Order inside each handler:

1. `parseJsonBody` with the route's body schema (size limit, JSON, shape).
2. `parseChatMessages` on `messages`.
3. `consumeChatQuota()`: session plus quota, in one RPC.
4. `resolveChatModel()`, then `streamText`.

Invariants:

- **Rejected requests never cost quota.** Body and message checks run before `consumeChatQuota`, so a malformed request is answered 400/413 without being counted.
- **The quota fails closed.** If `consume_chat_request()` cannot run (RPC error, migration not applied), the route answers 500 and the model is not called.
- **The quota lives in the database.** Counts are rows in `public.chat_requests`, so they hold across serverless instances and restarts. Nothing is kept in memory.

## Surface

| Export                          | File                                                     | Contract                                                                                                       |
| ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `parseJsonBody(req, schema)`    | `lib/api/parse-json-body.ts`                             | `{ data }`, or `{ error }`: 413 over `MAX_JSON_BODY_BYTES`, 400 with the first zod issue otherwise             |
| `MAX_JSON_BODY_BYTES`           | `lib/api/parse-json-body.ts`                             | `1048576` bytes (1 MiB), counted on the raw body, not in characters                                            |
| `parseChatMessages(value)`      | `lib/llm/chat-messages.ts`                               | Async. The `UIMessage[]`, or `undefined` when the value is not an accepted conversation (rules below)          |
| `MAX_CHAT_MESSAGES`             | `lib/llm/chat-messages.ts`                               | `200`                                                                                                          |
| `consumeChatQuota()`            | `lib/llm/index.ts`                                       | Server-only. `undefined` when the request may proceed, else the `Response` to return (table below)             |
| `documentsChatBody`             | `features/documents/lib/chat-request.ts`                 | zod schema of the documents chat body                                                                          |
| `MAX_TEMPLATE_FIELDS`           | `features/documents/lib/chat-request.ts`                 | `100`                                                                                                          |
| `public.consume_chat_request()` | `supabase/migrations/20261015000000_chat_rate_limit.sql` | `security definer`; `boolean`. Executable by `authenticated` only                                              |
| `public.chat_requests`          | same migration                                           | `(id bigint identity, user_id uuid → profiles on delete cascade, created_at timestamptz)`; RLS on, no policies |

`parseJsonBody` is shared by every JSON route (admin routes included), so the 1 MiB limit applies to all of them.

## Rules and behavior

### Body

| Route                      | Schema                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/api/classification/chat` | object with `id` and `messages` (any value; extra keys such as `trigger` and `messageId` are ignored) |
| `/api/documents/chat`      | same, plus `templateId` and `schema` as below                                                         |

`documentsChatBody`, because `templateId` and the schema's names and descriptions are written into the system prompt:

- `templateId`: matches `^[a-z0-9][a-z0-9_-]{0,63}$`.
- `schema`: exactly `{ fields }`, 1 to 100 fields. Each field has exactly `name` (`^[a-z][a-z0-9_]{0,63}$`), `type` (`string`, `number`, `date` or `boolean`), `label` (1 to 80 characters), `description` (at most 500 characters) and optional `required` (boolean). Any other key, here or on a field, fails.

The schema still comes from the browser; the route does not compare it with the template files in `public/templates/`.

### Messages (`parseChatMessages`)

Accepted when all of these hold, else the route answers `400 {"error":"Invalid messages"}`:

- An array of 1 to 200 items.
- `safeValidateUIMessages` from `ai` accepts it as UI messages.
- No message has `role: "system"`: it would override the route's instructions.
- No part has `type: "file"`: the AI SDK downloads file URLs on the server for providers that do not take URLs, so a file part would make the server fetch any URL the browser chose.

The chat UI sends only text parts, so a real conversation never hits the last two rules.

### Quota (`consume_chat_request`)

Per user: **20 requests in the last minute** and **500 in the last 24 hours**, both rolling windows measured from the transaction's `now()`. One chat message is one request, whatever the number of model steps it takes.

1. Not approved (`is_approved()` false, which includes an e-mail outside the allowed domain) → raises `42501`.
2. Takes a transaction-scoped advisory lock on the user, so concurrent requests are counted one after the other.
3. Deletes the user's rows older than 24 hours.
4. Counts the remaining rows. If 20 or more are under a minute old, or 500 or more remain → returns `false` without inserting.
5. Otherwise inserts one row and returns `true`.

`consumeChatQuota()` responses:

| Case                              | Status | Body                                                                                                      |
| --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Supabase not configured           | 503    | `{"error":"Nenhum modelo de IA configurado. Peça a um administrador…"}` (same text as `resolveChatModel`) |
| No session                        | 401    | `{"error":"Authentication required"}`                                                                     |
| RPC raised `42501` (not approved) | 403    | `{"error":"Failed to check the chat quota"}`                                                              |
| Any other RPC error               | 500    | `{"error":"Failed to check the chat quota"}`, logged as `Failed to check the chat quota`                  |
| Quota used up                     | 429    | `{"error":"Limite de mensagens atingido. Aguarde um minuto e tente novamente."}`                          |
| Allowed                           | —      | `undefined`; one row recorded                                                                             |

The chat shows the `error` field as-is (`chatErrorMessage`), which is why the 429 text is in Portuguese. The 429 text says "um minuto" also when the daily quota is what ran out.

### Model errors

`toChatResponse` logs a stream error as `Chat stream failed` with the full error and sends the chat only `Não foi possível obter a resposta do assistente. Tente novamente.` Provider messages (wrong key, unknown model, provider quota) are visible only in the server log.

## What this does NOT do

- No per-route or per-module quota: both chats share the same 20/minute and 500/day.
- No admin setting for the limits; they are constants in `consume_chat_request()`. Changing them is a new migration that replaces the function.
- No `Retry-After` header and no remaining-quota header on the 429.
- No limit on output tokens or model steps beyond `stopWhen: isStepCount(5)` in each handler.
- No quota on the other routes (`/api/chats`, `/api/attachments`, `/api/admin/*`); they do not call the LLM.
- No check that the documents `schema` matches a real template.

## Gotchas

- **Every chat message fails with "Failed to check the chat quota" after a deploy** → `20261015000000_chat_rate_limit.sql` is not applied, so the RPC does not exist; the quota fails closed. → Apply the migration.
- **A chat that worked returns 400 `Invalid messages`** → the conversation passed 200 messages, or a client change started sending `file` or `system` parts. → Start a new chat; send attachments through `/api/attachments`, never as message parts.
- **A long documents chat returns 413** → the whole conversation is resent on every message and passed 1 MiB. → Start a new chat.
- **A new template's chat returns 400 with a regex message** → a field name is not snake_case, or the template id has upper case or spaces. → Rename it in the `.schema.json` and `index.json`.
- **A test of the quota in SQL keeps returning `false`** → rows from earlier runs are still inside the window. → `delete from public.chat_requests where user_id = '<id>';` as `postgres`.
- **The chat says "Não foi possível obter a resposta do assistente" and nothing else** → the provider failed mid-stream. → Read the `Chat stream failed` log on the server (Vercel → Logs) for the provider's message.

## Setup

Apply `supabase/migrations/20261015000000_chat_rate_limit.sql`. Nothing else: there are no environment variables for the limits.
