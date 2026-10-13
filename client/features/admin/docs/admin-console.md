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

Without Supabase configured the proxy is off, so `/admin` renders for anyone, but every API call returns 503 and the sections show "Admin console is not configured".

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

### Layout

`AdminConsole` (`features/admin/components/admin-console.tsx`) loads users (`useAdminUsers`) and settings (`useAdminSettings`) once, then renders, top to bottom:

1. **Setup banner**, only when `getSetupProblem(settings)` (`lib/sections.ts`) returns a problem. It shows one message, the first that applies:

   | Order | Problem        | Condition                                       | Button          |
   | ----- | -------------- | ----------------------------------------------- | --------------- |
   | 1     | `service_role` | `serviceRoleConfigured` is `false`              | none            |
   | 2     | `no_model`     | `settings.provider` or `settings.model` is null | Escolher modelo |
   | 3     | `no_key`       | no entry in `keys` for `settings.provider`      | Cadastrar chave |

   The button switches to the Modelo de IA tab.

2. **Three section tabs** (Radix Tabs; the selection is local state and starts on Usuários). Each tab shows a one-line summary from `summarizeSections` ("Carregando…" until its data loads):

   | Tab          | Summary                                                                                                                  |
   | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
   | Usuários     | `<n> aguardando aprovação` in the accent color when anyone is pending, else `<n> com acesso` (approved count)            |
   | Modelo de IA | `<model label> · <provider label>` for the saved choice (the raw id when not in the catalog), else `Nenhum modelo salvo` |
   | Acesso       | `@<allowedEmailDomain>`, else `Domínio do servidor`                                                                      |

3. **The selected section.** A users load or change error is shown above the Usuários content; a settings load error replaces Modelo de IA and Acesso.

### Usuários

- **Aguardando aprovação**: one card per pending user, with "Pediu acesso em <createdAt>" and the buttons Rejeitar and Aprovar. The block is hidden when nobody is pending.
- **Equipe**: approved and rejected users in a TanStack Table (`team-table.tsx`, configured in `lib/team-table.ts`). All filtering and sorting happens in the browser, on the list already loaded:
  - Search box: global filter on name or e-mail, case- and accent-insensitive (`matchesUserQuery`). A blank query matches everyone.
  - Status filter: Todos, Ativos (`approved`), Sem acesso (`rejected`), each with its count. It is single-choice, and clicking the active option keeps it selected.
  - Sorting: clicking Usuário cycles ascending → descending → off; Desde cycles descending → ascending → off. Names compare with `localeCompare` in pt-BR. With no sort active, rows keep the API order (approved before rejected, newest first).
  - Empty result: "Ninguém encontrado com esse filtro."
- Status labels on screen: `pending` Pendente, `approved` Ativo, `rejected` Sem acesso. "Sem acesso" covers both a rejected sign-up and revoked access.

| Status     | Where     | Actions shown                          | Request                                              |
| ---------- | --------- | -------------------------------------- | ---------------------------------------------------- |
| `pending`  | card      | Rejeitar, Aprovar                      | `status: rejected` / `status: approved`              |
| `approved` | table row | Tornar admin or Tornar membro, Revogar | `role: admin` or `role: member` / `status: rejected` |
| `rejected` | table row | Reativar                               | `status: approved`                                   |
| own row    | table row | none, marked "(você)"                  | —                                                    |

- Revoking is `status = 'rejected'`: the user lands on `/unauthorized` on their next request. Their chats and files stay in the database.
- Role buttons appear only for approved users. The API still accepts a role change on a pending or rejected user; it takes effect once they are approved.
- While one user is saving, every action button on the page is disabled and a spinner shows on that user. After each change the list is fetched again.

### Modelo de IA

1. One card per provider in `LLM_CATALOG` (`lib/llm/catalog.ts`). Each card shows "Chave ••••<last four>" or "Sem chave", and the saved provider carries "Em uso". Picking a card selects the saved model if it is the saved provider, otherwise that provider's first model.
2. The Modelo select lists the selected provider's models.
3. **One key field, for the selected provider only.**
   - With a key: `••••<last four>`, "atualizada em <date>" and Trocar, which opens the input with Cancelar.
   - Without a key: the input is open, with "Sem chave, este provedor não pode ser usado."
   - "Salvar chave" sends `PUT /api/admin/settings/keys/:provider`, then closes and clears the input.
4. "Salvar modelo" sends `llm: { provider, model }`. It is enabled only when `canSaveModel` holds: the choice differs from the saved one **and** the selected provider has a key. The API itself would accept a provider without a key; only the console refuses. "Descartar" restores the saved choice.
5. The footer line comes from `describeModelChoice`, in this order:
   1. unchanged: "Em uso: <model>." or "Nenhum modelo salvo.";
   2. selected provider without a key: "Cadastre a chave da <provider> para usar este provedor." (accent color);
   3. otherwise: "Alterações não salvas."

   After a save it shows "Modelo salvo.", or the server's error, which stays visible even while the choice is still changed.

The console is the only place the chat model comes from: there is no environment fallback (see `client/docs/llm-configuration.md`).

### Acesso

The domain input has a fixed `@` prefix; "Salvar domínio" is enabled once the trimmed value differs from the saved one. Saves `allowedEmailDomain`. Empty clears it, and then `ALLOWED_EMAIL_DOMAIN` from the environment applies (see `authentication.md`). Validation: after trimming, removing one leading `@` and lower-casing, the value must match `^[a-z0-9-]+(\.[a-z0-9-]+)+$` or be empty.

## What this does NOT do

- No key deletion and no way to clear the saved model. A key can only be replaced; to stop using a provider, choose another one. Removing a secret needs SQL (`delete from vault.secrets where name = 'llm_api_key_<provider>'`).
- No key validation: a wrong key is saved and fails on the next chat with the provider's error.
- No audit log beyond `app_settings.updated_by/updated_at` and `profiles.approved_by/approved_at`. Role changes and rejections leave no record of who made them.
- No e-mail or notification to the user when their access changes.
- The first admin is still created with SQL (Setup in `authentication.md`); the console cannot bootstrap itself.
- The model list is fixed in code. A model ID not in `LLM_CATALOG` is rejected with 400 even if the provider supports it.

## Gotchas

- **Everyone, admins included, lands on `/pending` after deploying** → the code reads `get_gate_state()`, which does not exist until the migration runs; the RPC errors and the status is treated as missing. → Apply `20261014000000_admin.sql` before (or together with) deploying the code.
- **Saved a model but the chat says "Nenhum modelo de IA configurado"** → `SUPABASE_SERVICE_ROLE_KEY` is not set on the server, or the saved provider has no key. → The setup banner names whichever applies first; set the variable (and redeploy) or add the key.
- **`PUT /api/admin/settings` returns 403 for an admin** → the update matched no row, because RLS hid it (`is_admin()` false: the profile is not `approved`) or the `app_settings` row was deleted. → Check the profile; restore the row with `insert into public.app_settings default values`.
- **"Admins cannot change their own access"** → deliberate. → Ask another admin, or use SQL.
- **`admin_set_provider_key` fails with a Vault permission error** → the function owner lacks access to `vault` (projects where the migration ran as a role other than `postgres`). → Run the migration as `postgres` (SQL editor or `supabase db push`).
- **A domain with a typo locks everyone out** → the domain check runs before approval for every request, admins included, in the proxy and in `is_approved()`/`is_admin()`, so no admin RPC works either. → Fix it with SQL as `postgres` (the SQL editor): `update public.app_settings set allowed_email_domain = null;`.

- **A class on a tab does not apply, e.g. the tab list stays 32px tall and the section cards overlap the content** → `shadcn/tailwind.css` maps `data-active` to `[data-state="active"]` and `data-horizontal` to `[data-orientation="horizontal"]`, so the primitive's variant classes (`group-data-horizontal/tabs:h-8`, `dark:data-active:border-input`) win over a plain `h-auto` or `border-primary`. → Override with the same variant (`group-data-horizontal/tabs:h-auto`, `dark:data-active:border-primary`), as `admin-console.tsx` and `section-tab.tsx` do.
- **A TanStack Table option or column method is missing** → the project uses TanStack Table v9: features are registered in `TEAM_TABLE_FEATURES` (`tableFeatures({...})`), and columns sort with `sortFn` (not `sortingFn`). → Register the feature there; the installed package ships its guides under `node_modules/@tanstack/react-table/skills/`.

## Setup

1. Apply `supabase/migrations/20261014000000_admin.sql` (needs the `supabase_vault` extension, enabled by default on Supabase; the migration runs `create extension if not exists`).
2. Set `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys: legacy `service_role` or a `sb_secret_…` secret key) in `client/.env.local` and in Vercel as a Secret for Production and Preview. Server-only: never prefix it with `NEXT_PUBLIC_`.
3. Make the first admin with SQL (see `authentication.md`), reload, and open "Administração" in the sidebar.
4. Pick provider and model, and save that provider's key. Until then no chat works.
