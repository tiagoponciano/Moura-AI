# Attachments

How files are attached to a chat now: direct upload to a private Supabase Storage bucket, a database row per file, and signed download links in the chat. For developers changing the limits or using the files elsewhere.

## What this is

The paperclip in the chat composer uploads files from the browser straight to the `attachments` bucket, under the user's own folder, then records each file through `POST /api/attachments`. The files of the current chat are listed above the composer as links. Files are stored for reference only; they are not sent to the model.

Invariants:

- **Uploads never pass through Vercel.** The browser talks to Supabase Storage directly; the app only receives metadata. This avoids Vercel's 4.5 MB request body limit.
- **Limits are enforced three times**: `checkAttachment` in the browser, again in `POST /api/attachments`, and by the bucket (`file_size_limit`, `allowed_mime_types`). The bucket is the one a modified client cannot skip.
- A user can only read, upload and delete objects under `<their user id>/` in the bucket, and only while approved (storage RLS).

## Surface

### HTTP

| Method | Path                       | Body / query                                             | Returns                                                                                                                          |
| ------ | -------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/attachments`         | `{ chatId, storagePath, fileName, mimeType, sizeBytes }` | `201 {"attachment": Attachment}`, errors below                                                                                   |
| `GET`  | `/api/attachments?chatId=` | `chatId`: UUID                                           | `200 {"attachments": Attachment[]}` oldest first; `400 {"error":"Invalid chatId"}`; `500 {"error":"Failed to list attachments"}` |

`POST` errors, in check order:

| Status | Body                                                       | When                                                                                                              |
| ------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 503    | `{"error":"Attachments are not configured"}`               | No Supabase env (both routes)                                                                                     |
| 401    | `{"error":"Authentication required"}`                      | No session (both routes; normally the proxy answers first)                                                        |
| 400    | `{"error":"Invalid attachment"}`                           | Body not JSON, `chatId` not a UUID, empty `storagePath`, `fileName` empty or over 255, `sizeBytes` not an integer |
| 400    | `{"error":"unsupported_type"}` / `"empty"` / `"too_large"` | `checkAttachment` problem                                                                                         |
| 403    | `{"error":"Storage path outside the user's folder"}`       | `isOwnStoragePath` is false                                                                                       |
| 400    | `{"error":"Uploaded file not found"}`                      | No object at `storagePath`                                                                                        |
| 500    | `{"error":"Failed to record attachment"}`                  | Insert failed (also logged)                                                                                       |

### Library

| Export                                            | File                            | Contract                                                                           |
| ------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `ATTACHMENTS_BUCKET`                              | `lib/attachments/rules.ts`      | `"attachments"`                                                                    |
| `ATTACHMENT_MAX_BYTES`                            | `lib/attachments/rules.ts`      | `20 * 1024 * 1024` = 20,971,520 bytes, inclusive                                   |
| `ATTACHMENT_MIME_TYPES`                           | `lib/attachments/rules.ts`      | See table below                                                                    |
| `ATTACHMENT_ACCEPT`                               | `lib/attachments/rules.ts`      | `.pdf,.png,.jpg,.jpeg,.webp,.docx` (file picker filter only)                       |
| `checkAttachment({mimeType, sizeBytes})`          | `lib/attachments/rules.ts`      | `"unsupported_type" \| "empty" \| "too_large" \| undefined`, checked in that order |
| `buildStoragePath(userId, name, id)`              | `lib/attachments/rules.ts`      | `<userId>/<id>-<safe name>`                                                        |
| `isOwnStoragePath(path, userId)`                  | `lib/attachments/rules.ts`      | Exactly two segments, first is `userId`, second not empty, `.` or `..`             |
| `uploadAttachment(file, chatId)`                  | `lib/attachments/client.ts`     | Browser; resolves to `Attachment` or throws `AttachmentUploadError`                |
| `fetchAttachments(chatId)`                        | `lib/attachments/client.ts`     | Browser; throws on non-2xx                                                         |
| `handleCreateAttachment`, `handleListAttachments` | `lib/attachments/server.ts`     | The two handlers                                                                   |
| `useChatAttachments(chatId, enabled)`             | `hooks/use-chat-attachments.ts` | `{ attachments, uploading, problems, attach(files) }` for one chat                 |

## Data shapes

| Accepted type | MIME type                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| PDF           | `application/pdf`                                                         |
| PNG           | `image/png`                                                               |
| JPEG          | `image/jpeg`                                                              |
| WebP          | `image/webp`                                                              |
| Word          | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

```sql
attachments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references profiles on delete cascade,
  chat_id      uuid,                    -- no foreign key: files can be attached before the chat row exists
  storage_path text not null unique,    -- "<user_id>/<uuid>-<safe name>"
  file_name    text not null,           -- original name as picked, shown in the UI
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),   -- bytes
  created_at   timestamptz not null default now()
)
```

```jsonc
// Attachment (both routes)
{
  "id": "6f1c…",
  "fileName": "Habite-se Ação.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 482113, // bytes
  "createdAt": "2026-10-13T17:05:12.345+00:00",
  "url": "https://<ref>.supabase.co/storage/v1/object/sign/attachments/…?token=…", // valid 1 hour; null if signing failed
}
```

## Rules and behavior

### Upload (`uploadAttachment`)

1. `checkAttachment` with the browser's `file.type` and `file.size`; a problem throws before any network call.
2. Get the signed-in user from the browser client; none → failure.
3. Path = `buildStoragePath(user.id, file.name, crypto.randomUUID())`. The safe name strips accents (NFD), replaces every run of characters outside `A-Z a-z 0-9 . _ -` with `-`, collapses repeated `-`, trims `-` at both ends, cuts to 100 characters, and falls back to `file`. `Habite-se Ação (1).pdf` → `Habite-se-Acao-1-.pdf`.
4. Upload to the bucket with `contentType: file.type`. Error → failure (logged as `Failed to upload attachment`).
5. `POST /api/attachments`. Non-2xx or no response → remove the uploaded object, then failure.

### Recording (`POST`)

Checks run in the order of the error table. The insert sets `user_id` explicitly; the RLS `with check` also requires the path's first segment to equal `auth.uid()`. The response includes a fresh signed URL.

### In the chat

- The paperclip shows only when `Chat` has `history` and Supabase is configured (both modules). It opens a multi-select picker filtered by `ATTACHMENT_ACCEPT`.
- Selected files upload in parallel. While uploading, the paperclip shows a spinner and the list shows "Enviando…".
- Each failed file adds one line `<file name>: <message>`:

| Problem            | Message                                                   |
| ------------------ | --------------------------------------------------------- |
| `unsupported_type` | Tipo de arquivo não suportado. Envie PDF, imagem ou DOCX. |
| `too_large`        | Arquivo maior que 20 MB.                                  |
| `empty`            | O arquivo está vazio.                                     |
| any other failure  | Não foi possível enviar o arquivo.                        |

- Successful files are appended to the list as links (file name, opens the signed URL in a new tab). Error lines clear on the next upload or when the chat changes.
- The list loads with `GET /api/attachments?chatId=` whenever the chat id changes (mount, "Nova conversa", reopening from "Histórico"). A load failure is only logged.

## What this does NOT do

- Files are not sent to Claude and the assistant does not know they exist.
- No delete or rename in the UI, and no link between a file and a specific message.
- No DWG or other formats beyond the five types above; no virus scanning.
- Signed URLs are not refreshed: a link older than one hour stops working until the chat is reopened or the page reloaded.
- Files attached in a chat that never got a response stay in Storage and in `attachments`, but that chat never appears in "Histórico", so they are unreachable from the UI.

## Gotchas

- **A `.dwg` (or a file with an unknown extension) is rejected as unsupported** → browsers report DWG as `application/octet-stream` or an empty type, which is not in the list. → Export to PDF; supporting DWG means adding the type to `ATTACHMENT_MIME_TYPES`, `ATTACHMENT_ACCEPT` and the bucket.
- **Raising the size limit in `rules.ts` has no effect** → the bucket still enforces 20 MB. → Change `ATTACHMENT_MAX_BYTES` and the bucket's `file_size_limit` together. The bucket row is created by a migration that has already run, so the change needs a new migration (`update storage.buckets set file_size_limit = … where id = 'attachments'`).
- **Upload fails for every file with no visible reason** → no session in the browser client, the user is not approved (storage RLS), or the bucket migration was not applied. → Check the console for `Failed to upload attachment` and the Storage error.
- **Object in Storage without an `attachments` row** → recording failed and the cleanup `remove` failed too. → Harmless; delete it from the Storage dashboard.
- **Routing uploads through an API route instead** → Vercel rejects request bodies over 4.5 MB with `413`. → Keep the direct upload.

## Setup

Same Supabase project and env vars as `authentication.md`. The table, bucket and storage policies come from `supabase/migrations/20261013000200_attachments.sql`.
