# Admin console

How the `/admin` page works now: user approval and roles, the AI provider/model choice, provider API keys and the allowed e-mail domain. For developers changing the console or calling its API.

## What this is

`/admin` is a page inside the app shell where approved admins manage who can use the app and which AI model the chats use. The browser talks only to `/api/admin/*` route handlers; those act as the signed-in user and change data through `security definer` RPCs and RLS defined in `supabase/migrations/20261014000000_admin.sql`. Which model the chats actually run is described in `client/docs/llm-configuration.md`.

Invariants:

- **Three layers check admin rights, independently.** The proxy (`resolveGate`) redirects non-admins away from `/admin` and answers `/api/admin/*` with 403; every RPC calls `public.is_admin()`; `app_settings` RLS only lets admins read and update. A request that slips past one layer still changes nothing.
- **Admins cannot change their own status or role.** The RPCs refuse `target = auth.uid()` and the UI hides the actions on the admin's own row. This keeps the last admin from locking everyone out; promoting a second admin is the only way to demote the first.
- **API keys never leave the database in clear.** They live in Supabase Vault; the console only ever receives their last four characters. The decrypted key is readable only through `get_llm_config()`, which is granted to `service_role` alone.

`public.is_admin()` is `true` only when the caller's profile is `status = 'approved'` **and** `role = 'admin'`: a rejected or pending admin has no admin rights.

## Surface

### Page

| Path     | Who reaches it                                | Notes                                                                          |
| -------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `/admin` | Approved admins; others are redirected to `/` | Sidebar shows "Administração" only to admins; breadcrumb reads "Administração" |

Without Supabase configured the proxy is off, so `/admin` renders for anyone, but every API call returns 503 and the panels show "Admin console is not configured".

### API

All routes run behind the proxy and need a session cookie. Errors are `{"error": string}`.

| Method  | Path                                 | Body                            | Success | Errors                                                               |
| ------- | ------------------------------------ | ------------------------------- | ------- | -------------------------------------------------------------------- |
| `GET`   | `/api/admin/users`                   | —                               | 200     | 401, 403, 503, 500 `Failed to list users`                            |
| `PATCH` | `/api/admin/users/:id`               | `{ status?, role? }`            | 204     | 400 (validation or own row), 403, 404 `Profile not found`, 503, 500  |
| `GET`   | `/api/admin/settings`                | —                               | 200     | 401, 403, 503, 500 `Failed to load settings`                         |
| `PUT`   | `/api/admin/settings`                | `{ llm?, allowedEmailDomain? }` | 204     | 400, 403 `Admin only`, 503, 500 `Failed to save settings`            |
| `PUT`   | `/api/admin/settings/keys/:provider` | `{ key }`                       | 204     | 400 (validation or blank key), 403, 404 `Unknown provider`, 503, 500 |

- 401 `Authentication required` and 403 `Admin only` come from the proxy for non-admins; the handlers return the same codes if a request reaches them anyway.
- 503 `Admin console is not configured`: Supabase env vars are empty.

### Database (`20261014000000_admin.sql`)

| Object                                      | Kind                         | Callable by     | Contract                                                                                                                         |
| ------------------------------------------- | ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `is_admin()`                                | function, definer            | `authenticated` | Caller is approved and `role = 'admin'`                                                                                          |
| policy `Admins read all profiles`           | RLS select on `profiles`     | admins          | Admins see every profile; members still see only their own row                                                                   |
| `admin_set_user_status(target, new_status)` | function, definer            | `authenticated` | Admin only, not on self. `approved` sets `approved_at = now()`, `approved_by = auth.uid()`; any other status sets both to `null` |
| `admin_set_user_role(target, new_role)`     | function, definer            | `authenticated` | Admin only, not on self. Changes `role` only                                                                                     |
| `app_settings`                              | table, one row (`id = true`) | admins (RLS)    | `llm_provider`, `llm_model`, `allowed_email_domain`, `updated_at`, `updated_by`                                                  |
| trigger `app_settings_touch`                | before update                | —               | Sets `updated_at = now()` and `updated_by = auth.uid()` on every update                                                          |
| `admin_set_provider_key(provider, api_key)` | function, definer            | `authenticated` | Admin only. Trims; blank → error. Creates or updates Vault secret `llm_api_key_<provider>`                                       |
| `admin_list_provider_keys()`                | function, definer            | `authenticated` | Admin only. One row per provider that has a secret: `provider`, `last_four`, `updated_at`                                        |
| `get_llm_config()`                          | function, definer            | `service_role`  | See `llm-configuration.md`                                                                                                       |
| `get_gate_state()`                          | function, definer            | `authenticated` | See `authentication.md`                                                                                                          |
| enum `llm_provider`                         | type                         | —               | `anthropic`, `openai`, `google`                                                                                                  |

RPC errors and how the handlers map them:

| Raised message                          | SQLSTATE | HTTP |
| --------------------------------------- | -------- | ---- |
| `Admin only`                            | `42501`  | 403  |
| `Admins cannot change their own access` | `22023`  | 400  |
| `API key is empty`                      | `22023`  | 400  |
| `Profile not found`                     | `P0002`  | 404  |

## Data shapes

`GET /api/admin/users`, sorted pending → approved → rejected, newest `createdAt` first within each:

```jsonc
{
  "users": [
    {
      "id": "6f1c…-uuid",
      "email": "ana@mourasengenharia.com", // lower-cased
      "name": "Ana Souza", // null when Google sent no name
      "avatarUrl": null, // nullable
      "status": "pending", // "pending" | "approved" | "rejected"
      "role": "member", // "admin" | "member"
      "approvedAt": null, // ISO timestamp; null unless status is "approved"
      "createdAt": "2026-10-13T18:30:00.000Z",
    },
  ],
  "currentUserId": "1a2b…-uuid", // the caller; the UI disables this row
}
```

`PATCH /api/admin/users/:id`, at least one field, no others:

```jsonc
{ "status": "approved" }                   // "pending" | "approved" | "rejected"
{ "role": "admin" }                        // "admin" | "member"
{ "status": "approved", "role": "admin" }  // status is applied first
```

`GET /api/admin/settings`:

```jsonc
{
  "settings": {
    "provider": "openai", // null until an admin saves one; chats do not work meanwhile
    "model": "gpt-5.5", // null together with provider
    "allowedEmailDomain": "mourasengenharia.com", // null → ALLOWED_EMAIL_DOMAIN applies
    "updatedAt": "2026-10-13T18:00:00.000Z",
  },
  "keys": [
    {
      "provider": "anthropic",
      "lastFour": "a1B2",
      "updatedAt": "2026-10-12T13:00:00.000Z",
    },
  ], // only providers that have a key
  "serviceRoleConfigured": true, // SUPABASE_SERVICE_ROLE_KEY set on the server
}
```

`PUT /api/admin/settings`, at least one field, no others:

```jsonc
{ "llm": { "provider": "google", "model": "gemini-2.5-pro" } } // model must be in the catalog for that provider; null is rejected
{ "allowedEmailDomain": "@Moura.com " }    // stored as "moura.com"
{ "allowedEmailDomain": "" }               // stored as null
```

`PUT /api/admin/settings/keys/openai`:

```jsonc
{ "key": "sk-…" } // trimmed, 1–500 characters
```

## Rules and behavior

### User actions in the UI

| Status     | Actions shown                          | Request                                              |
| ---------- | -------------------------------------- | ---------------------------------------------------- |
| `pending`  | Aprovar, Rejeitar                      | `status: approved` / `status: rejected`              |
| `approved` | Tornar admin or Tornar membro, Revogar | `role: admin` or `role: member` / `status: rejected` |
| `rejected` | Aprovar                                | `status: approved`                                   |
| own row    | none, marked "(você)"                  | —                                                    |

- Revoking is `status = 'rejected'`: the user lands on `/unauthorized` on their next request. Their chats and files stay in the database.
- Role buttons appear only for approved users. The API still accepts a role change on a pending or rejected user; it takes effect once they are approved.
- While one row is saving, every action button is disabled; after each change the list is fetched again.
- The status filter (Todos, Pendente, Aprovado, Rejeitado) is client-side.

### Model panel

1. Provider select lists `LLM_CATALOG` (`lib/llm/catalog.ts`); changing it picks the provider's first model.
2. "Salvar modelo" sends `llm: { provider, model }`; disabled while nothing changed.
3. One key field per provider. The placeholder and help text show `••••<last four>` and the update time, or "Sem chave para este provedor". "Salvar"/"Trocar" sends the key, then clears the input.
4. Warnings, each saying the chats do not work until it is fixed: `serviceRoleConfigured: false`; saved provider without a key; no model saved.

The console is the only place the chat model comes from: there is no environment fallback (see `client/docs/llm-configuration.md`).

### Access panel

Saves `allowedEmailDomain`. Empty clears it, and then `ALLOWED_EMAIL_DOMAIN` from the environment applies (see `authentication.md`). Validation: after trimming, removing one leading `@` and lower-casing, the value must match `^[a-z0-9-]+(\.[a-z0-9-]+)+$` or be empty.

## What this does NOT do

- No key deletion and no way to clear the saved model. A key can only be replaced; to stop using a provider, choose another one. Removing a secret needs SQL (`delete from vault.secrets where name = 'llm_api_key_<provider>'`).
- No key validation: a wrong key is saved and fails on the next chat with the provider's error.
- No audit log beyond `app_settings.updated_by/updated_at` and `profiles.approved_by/approved_at`. Role changes and rejections leave no record of who made them.
- No e-mail or notification to the user when their access changes.
- The first admin is still created with SQL (Setup in `authentication.md`); the console cannot bootstrap itself.
- The model list is fixed in code. A model ID not in `LLM_CATALOG` is rejected with 400 even if the provider supports it.

## Gotchas

- **Everyone, admins included, lands on `/pending` after deploying** → the code reads `get_gate_state()`, which does not exist until the migration runs; the RPC errors and the status is treated as missing. → Apply `20261014000000_admin.sql` before (or together with) deploying the code.
- **Saved a model but the chat says "Nenhum modelo de IA configurado"** → `SUPABASE_SERVICE_ROLE_KEY` is not set on the server, or the saved provider has no key. → The panel shows a warning for both; set the variable (and redeploy) or add the key.
- **`PUT /api/admin/settings` returns 403 for an admin** → the update matched no row, because RLS hid it (`is_admin()` false: the profile is not `approved`) or the `app_settings` row was deleted. → Check the profile; restore the row with `insert into public.app_settings default values`.
- **"Admins cannot change their own access"** → deliberate. → Ask another admin, or use SQL.
- **`admin_set_provider_key` fails with a Vault permission error** → the function owner lacks access to `vault` (projects where the migration ran as a role other than `postgres`). → Run the migration as `postgres` (SQL editor or `supabase db push`).
- **A domain with a typo locks everyone out** → the domain check runs before approval for every request, admins included. → Fix it with SQL: `update public.app_settings set allowed_email_domain = null;`.

## Setup

1. Apply `supabase/migrations/20261014000000_admin.sql` (needs the `supabase_vault` extension, enabled by default on Supabase; the migration runs `create extension if not exists`).
2. Set `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys: legacy `service_role` or a `sb_secret_…` secret key) in `client/.env.local` and in Vercel as a Secret for Production and Preview. Server-only: never prefix it with `NEXT_PUBLIC_`.
3. Make the first admin with SQL (see `authentication.md`), reload, and open "Administração" in the sidebar.
4. Pick provider and model, and save that provider's key. Until then no chat works.
