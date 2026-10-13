# Authentication

How sign-in and access control work now: Google login (our button opens Google's popup, the server turns the result into a Supabase Auth session), an admin-approval step, the admin-only area, and the proxy that gates every page and API route. For developers setting up an environment or adding routes.

## What this is

Users press "Entrar com Google" on `/login`, an app button that opens Google's account chooser in a popup. Google hands the page a one-time authorization code; `POST /api/auth/google` trades it for an ID token with the client secret and `supabase.auth.signInWithIdToken` turns that into a Supabase session in the response cookies. The browser never visits the Supabase domain, so Google's account chooser names our site instead of `<project-ref>.supabase.co`. Supabase Auth creates the user, and a database trigger creates a `profiles` row with `status = 'pending'`. `client/proxy.ts` runs before every matched request: it refreshes the session cookie, reads the profile status, the role and the allowed e-mail domain in one RPC (`get_gate_state()`) and either lets the request through or sends it to `/login`, `/pending` or `/unauthorized`. Admins approve, reject and promote users on `/admin` (see `features/admin/docs/admin-console.md`); only the first admin is made with SQL.

Invariants:

- **Auth is off when Supabase is not configured.** Without both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the proxy returns `NextResponse.next()` for everything, `/login` says login is not configured, and the app behaves as an open tool with no persistence.
- **The login button also needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.** Without it `/login` says login is not configured, but the gate still runs when the Supabase variables are set, so nobody can sign in.
- **The exchange needs `GOOGLE_CLIENT_SECRET` on the server.** Without it the button shows and the popup opens, but `POST /api/auth/google` answers 503 and the page shows "Não foi possível entrar. Tente novamente."
- **The ID token never reaches the browser.** The server gets it straight from Google's token endpoint, so there is no nonce: there is no browser-side token to replay.
- The proxy decides; the database enforces. Every table and the storage bucket have RLS that requires `auth.uid()` to own the row **and** `public.is_approved()`, so a request that slips past the proxy still reads and writes nothing.
- Users cannot approve themselves: `profiles` has no update policy at all. Access changes go through `admin_set_user_status`/`admin_set_user_role`, which require `public.is_admin()` and refuse the caller's own row.
- `role` matters only for the admin area: `/admin` and `/api/admin/*` need an approved admin. It grants nothing else.

## Surface

### Routes

| Path                     | Kind           | Layout                         | Who reaches it                                                    |
| ------------------------ | -------------- | ------------------------------ | ----------------------------------------------------------------- |
| `/login`                 | page           | `app/(auth)/layout.tsx`        | Visitors without a session                                        |
| `/pending`               | page           | `app/(auth)/layout.tsx`        | Signed-in users whose profile is `pending` or missing             |
| `/unauthorized`          | page           | `app/(auth)/layout.tsx`        | Signed-in users who are `rejected` or outside the domain          |
| `/api/auth/google`       | API (`POST`)   | —                              | Everyone; the gate lets it through before any other check         |
| `/admin`, `/api/admin/*` | page and APIs  | `app/(app)/layout.tsx` (page)  | Approved users with `role = 'admin'`, once Supabase is configured |
| everything else          | pages and APIs | `app/(app)/layout.tsx` (pages) | Approved users only, once Supabase is configured                  |

`app/(auth)/layout.tsx` centers the page's content with the theme toggle in the corner and no sidebar. `/login` shows only the Moura logo, "Moura Engenharia", "Prevenção contra incêndio" and the "Entrar com Google" button (the app's outline `Button` with Google's "G"), with no card around them; `/pending` and `/unauthorized` use the bordered `AuthCard` with a title and an explanation. Module pages live under `app/(app)/`, whose layout holds the sidebar shell (see `app-shell.md`). Route groups do not change URLs.

Proxy matcher: every path except `_next/static`, `_next/image`, `favicon.ico`, `icon.png`, `brand/…` and paths ending in `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`. `/api/*` and `/templates/*` are gated.

### Library

| Export                          | File                       | Contract                                                                                                                                              |
| ------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveGate(input)`            | `lib/auth/gate.ts`         | Pure; returns `{type:"allow"}`, `{type:"redirect",to}` or `{type:"deny",status,error}` (order below)                                                  |
| `isEmailAllowed(email, dom)`    | `lib/auth/gate.ts`         | `true` when `dom` is empty/undefined; else case-insensitive `endsWith("@" + dom)`, a leading `@` in `dom` is ignored                                  |
| `AUTH_PATHS`                    | `lib/auth/gate.ts`         | `login`, `pending`, `unauthorized` paths                                                                                                              |
| `ADMIN_PATH`                    | `lib/auth/gate.ts`         | `"/admin"`; the gate also guards `/api/admin`                                                                                                         |
| `GOOGLE_SIGN_IN_API`            | `lib/auth/gate.ts`         | `"/api/auth/google"`; always allowed by the gate, posted to by the login page                                                                         |
| `isCurrentUserAdmin()`          | `lib/auth/is-admin.ts`     | Server-only; `get_gate_state()` says approved and `admin`. `false` without Supabase or session. Used by the app layout to show the sidebar link       |
| `requireUser(message)`          | `lib/auth/require-user.ts` | Server-only; `{ supabase, user }` for route handlers, or `{ error }`: 503 `message` without Supabase, 401 `Authentication required` without a session |
| `signOut()`                     | `lib/auth/sign-out.ts`     | Browser-only; `supabase.auth.signOut()` then full reload on `/login`                                                                                  |
| `getSupabaseEnv()`              | `lib/supabase/env.ts`      | `{ url, anonKey }` or `undefined` when either variable is empty                                                                                       |
| `isSupabaseConfigured()`        | `lib/supabase/env.ts`      | `getSupabaseEnv() !== undefined`; usable in client and server code                                                                                    |
| `createSupabaseServerClient()`  | `lib/supabase/server.ts`   | Server-only, one per request, acts as the signed-in user; `undefined` without env                                                                     |
| `createSupabaseBrowserClient()` | `lib/supabase/client.ts`   | Browser singleton; `undefined` without env                                                                                                            |
| `refreshSession(request, env)`  | `lib/supabase/proxy.ts`    | Proxy-only; returns `user`, `supabase` and `respond`/`redirect`/`deny` that carry refreshed cookies                                                   |

`features/auth` exports `LoginCard`, `PendingCard` and `UnauthorizedCard`; its server entry `features/auth/server` exports `handleGoogleSignIn`, which `app/api/auth/google/route.ts` serves as `POST`. Inside it, `hooks/use-google-sign-in.ts` drives the popup and the exchange, `lib/google-identity.ts` holds the Google script URL, its types and `getGoogleClientId()`, and `components/google-logo.tsx` is Google's "G". `components/layout/user-menu.tsx` is the sidebar footer menu.

### Database (`supabase/migrations/20261013000000_profiles.sql`)

```sql
profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null unique,      -- lower-cased copy of auth.users.email
  name        text,                      -- Google full_name, else name; null if neither
  avatar_url  text,                      -- Google avatar_url
  status      user_status not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  role        user_role   not null default 'member',   -- 'admin' | 'member'
  approved_at timestamptz,               -- set by admin_set_user_status on approval, null otherwise; SQL updates must set it by hand
  approved_by uuid references profiles on delete set null,  -- the approving admin, same rule
  created_at  timestamptz not null default now()
)
```

- Trigger `on_auth_user_created` (after insert on `auth.users`) runs `handle_new_user()` (`security definer`) to insert the profile. It runs on insert only; later Google name or avatar changes do not update `profiles`.
- `public.is_approved()` (`security definer`, `stable`): `true` when the caller's profile exists with `status = 'approved'`. Every other RLS policy calls it.
- `public.is_admin()` (`20261014000000_admin.sql`): `true` when the caller is approved **and** `role = 'admin'`.
- Policy `Users read their own profile`: `select` for `authenticated` where `id = auth.uid()`. Policy `Admins read all profiles`: `select` where `is_admin()`. No insert, update or delete policies.
- `public.get_gate_state()` (`security definer`, `stable`, `authenticated` only): always exactly one row `{ status, role, allowed_email_domain }`. `status` and `role` are `null` when the caller has no profile; `allowed_email_domain` comes from `app_settings`.

## Rules and behavior

### Gate resolution (`resolveGate`)

0. Path is exactly `/api/auth/google` → allow, whatever the session (`/api/auth/google/x` is gated as usual).
1. Work out where the user belongs:
   - no session → `/login`;
   - email outside the allowed domain, or `status = 'rejected'` → `/unauthorized`;
   - `status` is `pending` or the profile row is missing → `/pending`;
   - otherwise the user is approved and belongs nowhere in particular.
2. Approved user:
   - path is `/login`, `/pending` or `/unauthorized` → redirect to `/`;
   - `role` is not `admin` and path is `/api/admin` or under `/api/admin/` → `403 {"error":"Admin only"}`;
   - `role` is not `admin` and path is `/admin` or under `/admin/` → redirect to `/`;
   - any other path → allow.
3. Not approved, path starts with `/api/` → no redirect. Respond `401 {"error":"Authentication required"}` without a session, `403 {"error":"Access not approved"}` with one.
4. Not approved, path equals the place from step 1 → allow; otherwise redirect there.

Admin paths are matched by segment: `/administrator` and `/api/administer` are ordinary paths. A pending or rejected admin is handled by step 1 like anyone else.

Allowed domain, first non-empty wins: `app_settings.allowed_email_domain` (set on `/admin`), then `ALLOWED_EMAIL_DOMAIN`; if both are empty every domain is accepted.

| Session | Domain ok | `status`            | `/documents`      | `/login`          | `/api/chats` |
| ------- | --------- | ------------------- | ----------------- | ----------------- | ------------ |
| none    | —         | —                   | → `/login`        | allow             | 401          |
| yes     | no        | any                 | → `/unauthorized` | → `/unauthorized` | 403          |
| yes     | yes       | `rejected`          | → `/unauthorized` | → `/unauthorized` | 403          |
| yes     | yes       | `pending` or no row | → `/pending`      | → `/pending`      | 403          |
| yes     | yes       | `approved`          | allow             | → `/`             | allow        |

For approved users, `/admin` is allowed for `admin` and redirects `member` to `/`; `/api/admin/*` is allowed for `admin` and returns 403 to `member`.

Rejected users go to `/unauthorized`, not `/pending`, deliberately: "aguardando aprovação" would be false for them.

### Proxy (`client/proxy.ts`)

1. No Supabase env → `NextResponse.next()`.
2. `refreshSession`: Supabase server client over the request cookies; `auth.getUser()` validates the token with Supabase Auth. Refreshed cookies are written to the request and to the response, with the no-cache headers Supabase supplies.
3. With a user, call `get_gate_state()` for `status`, `role` and `allowed_email_domain`. An RPC error is treated like a missing profile (`status` and `role` `null`).
4. `resolveGate` with the allowed domain resolved as above (`ALLOWED_EMAIL_DOMAIN` read at request time).
5. Allow → the pass-through response; redirect → `NextResponse.redirect` to the target; deny → JSON with the status. Redirects and denials copy the refreshed cookies, so a token refresh is never lost.

Every gated request costs one Auth call and one RPC. Pages under `app/(app)/` add one more `get_gate_state()` call in the layout (`isCurrentUserAdmin`) to decide whether the sidebar shows "Administração".

### Sign-in

1. `LoginCard` renders only when both Supabase variables and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are set; otherwise it shows "O login não está configurado neste ambiente."
2. It loads `https://accounts.google.com/gsi/client` with `next/script`. On every mount once the script is ready, `google.accounts.oauth2.initCodeClient({ client_id, scope: "openid email profile", ux_mode: "popup" })` runs; the button is disabled until then.
3. Click → `requestCode()` opens Google's account chooser in a popup. If the browser blocks it, the page shows "O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo." Closing the popup or declining shows nothing.
4. Google returns `{ code }` to the page. The button turns into a spinner with "Entrando…" and the page posts `{ code }` to `/api/auth/google` with `X-Requested-With: XMLHttpRequest`.
5. The server posts the code to `https://oauth2.googleapis.com/token` with `client_id`, `client_secret`, `redirect_uri: "postmessage"` and `grant_type: "authorization_code"`, then calls `signInWithIdToken({ provider: "google", token: id_token })` on the request-scoped Supabase client. Supabase checks the token's audience against the client IDs configured in its Google provider, creates or finds the user, and the session cookies are set on the 204 response.
6. Success → `router.replace("/")`; the proxy applies the domain and approval checks on that request.
7. Failure (any non-2xx, or the request itself fails) → the button comes back, the page shows "Não foi possível entrar. Tente novamente." and logs `Google sign-in failed` with the status. A code works once: pressing the button again opens a new popup.

`POST /api/auth/google` responses, in the order they are checked:

| Status | Body                                                | When                                                                                                              |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 403    | `{"error":"Missing X-Requested-With header"}`       | Header absent or not exactly `XMLHttpRequest` (Google's CSRF guard for this flow)                                 |
| 503    | `{"error":"Google sign-in is not configured"}`      | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` or the Supabase variables missing                          |
| 400    | `{"error":"Invalid body"}`                          | Body is not JSON `{ "code": "<non-empty string>" }`                                                               |
| 401    | `{"error":"Google rejected the sign-in"}`           | Token endpoint answered non-2xx; logged as `Google rejected the authorization code` with Google's status and body |
| 502    | `{"error":"Google did not return an ID token"}`     | Token endpoint answered 2xx without `id_token`                                                                    |
| 401    | `{"error":"Supabase rejected the Google ID token"}` | `signInWithIdToken` failed; logged as `Failed to sign in with the Google ID token`                                |
| 204    | empty, with the Supabase session cookies            | Signed in                                                                                                         |

### Signed-in UI

- Sidebar footer (`UserMenu`): avatar (Google `avatar_url`, initials of up to two words as fallback), name (`full_name` → `name` → email) and email from the Auth user metadata, not from `profiles`. The dropdown has "Sair". Renders nothing without Supabase or a session.
- `/pending` and `/unauthorized` show a "Sair e usar outra conta" button. Both sign-out paths call `signOut()`.

## What this does NOT do

- No approval e-mails and no notification when a user signs up; admins see new users as "Pendente" on `/admin`.
- No sign-in method other than Google, and no `next` redirect back to the page the user first opened: after login everyone lands on `/`.
- No Google One Tap prompt and no redirect-based OAuth flow: there is no `/auth/callback` route, and Supabase's Redirect URLs list is not used by this app.
- The account chooser shows our site's domain, not "Moura Engenharia", until Google verifies the brand in the OAuth consent screen settings.
- Outside `/admin`, an `admin` has the same access as a `member`: RLS still limits chats and attachments to their owner, so admins cannot read other users' data.
- The domain restriction is not enforced in the database: a user outside the domain still gets a `pending` profile row when they sign in (and shows up on `/admin`), and is blocked only by the proxy check.
- Server Actions are not covered by a separate check (there are none); route handlers rely on the proxy plus RLS.

## Gotchas

- **Google's popup says "origin is not allowed" / `Error 400: origin_mismatch`** → the page's origin is not an Authorized JavaScript origin of the OAuth client. → Google Cloud → Clients → the web client: add the exact origin (`http://localhost`, `http://localhost:3000`, each Vercel domain used). Wildcards are not accepted, so every Vercel preview URL that should allow login must be listed; the per-branch URL (`<project>-git-<branch>-<team>.vercel.app`) stays the same across that branch's deploys.
- **"Não foi possível entrar" right after picking an account, and `POST /api/auth/google` returned 503** → `GOOGLE_CLIENT_SECRET` is not set where the server runs. → Add it to `client/.env.local` (restart `pnpm dev`) or to Vercel and redeploy.
- **"Não foi possível entrar", server log shows `Google rejected the authorization code` with `invalid_client`** → `GOOGLE_CLIENT_SECRET` does not belong to the client in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. → Copy the secret of that same web client from Google Cloud → Clients. With `invalid_grant` instead, the code was already used or expired; pressing the button again gets a new one.
- **"Não foi possível entrar", server log shows `Failed to sign in with the Google ID token`** → Supabase rejected the token: the client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not among the client IDs in Supabase → Authentication → Providers → Google, or the Google provider is disabled. → Use the same web client ID in both places.
- **The button does nothing in an embedded browser or with a strict popup blocker, and the page says the browser blocked Google's window** → the account chooser is a popup and must open from the click. → Allow popups for the site; never call `requestCode()` outside a click handler, or every browser blocks it.
- **A script or `fetch` without the header gets 403 from `/api/auth/google`** → expected: `X-Requested-With: XMLHttpRequest` is required as the CSRF guard. → Send it; the login page already does.
- **Login page says login is not configured, yet every page redirects to it** → Supabase variables are set but `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not. → Set it and redeploy.
- **Sign-in hangs or fails only on some networks (e.g. the UFSC network)** → the network resets TLS connections to `*.supabase.co`, which the proxy and every API route need, including the sign-in exchange on a local dev server. `curl https://<project-ref>.supabase.co/auth/v1/health` fails with "Connection reset by peer" there. → Use another network; nothing in the app can work around it.
- **Everyone lands on `/pending`** → expected: new profiles are `pending`. → Approve them on `/admin`; the first admin with the SQL in Setup.
- **Everyone, including approved admins, lands on `/pending` after a deploy** → `get_gate_state()` does not exist yet (migration `20261014000000_admin.sql` not applied); the proxy treats the RPC error as a missing profile. → Apply the migration.
- **Signed in as admin but no "Administração" in the sidebar, or `/admin` sends you to `/`** → `role` is still `member`, or the profile is not `approved`. → Check the row; reload after changing it.
- **Env vars set on Vercel but the app still has no login** → `NEXT_PUBLIC_*` values are inlined at build time. → Redeploy after setting them. `ALLOWED_EMAIL_DOMAIN` is read at runtime, but redeploy anyway to be safe.
- **`curl` or a script gets `401` from `/api/documents/chat`** → the proxy gates API routes too once Supabase is configured. → Call it from a signed-in browser session, or unset the Supabase variables locally.
- **A page shows a stale user after token refresh** → Server Components cannot write cookies (`createSupabaseServerClient` swallows that error on purpose). → Keep the proxy matcher covering the page; it is what writes refreshed cookies.
- **Local development suddenly requires login** → `client/.env.local` has the Supabase variables. → Leave them empty to work without auth.
- **Approved on `/admin` but still on `/pending`** → the user's page was rendered before the update. → Reload; the proxy reads the status on every request.

## Setup

1. Create a Supabase project. Apply `supabase/migrations/*.sql` in filename order (SQL editor, or `supabase db push` with the Supabase CLI linked to the project).
2. Google Cloud console: create an OAuth client (Web). Authorized JavaScript origins: `http://localhost`, `http://localhost:3000` and every Vercel domain that should allow login. No redirect URI is needed: the popup returns the code with `redirect_uri: "postmessage"`.
3. Supabase → Authentication → Providers → Google: enable it and paste the client ID and secret.
4. Env vars (`client/.env.local` locally, Vercel project settings in production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the same client ID), `GOOGLE_CLIENT_SECRET` (the same client's secret; server-only, never prefix it with `NEXT_PUBLIC_`), optional `ALLOWED_EMAIL_DOMAIN` (e.g. `mourasengenharia.com`; the domain saved on `/admin` overrides it), and `SUPABASE_SERVICE_ROLE_KEY`, without which no chat works because the AI model saved on `/admin` cannot be read (see `llm-configuration.md`). On Vercel, check the variables are enabled for the environment being deployed (Production, Preview) and redeploy.
5. Sign in once, then make yourself the first admin in the SQL editor:

   ```sql
   update public.profiles
   set status = 'approved', role = 'admin', approved_at = now()
   where email = 'you@example.com';
   ```

   Reload: "Administração" appears in the sidebar. Approve, reject and promote everyone else on `/admin`.

6. Replace `client/lib/supabase/database.types.ts` with `supabase gen types typescript --project-id <ref>` output when the schema changes; until then it is maintained by hand to match the migrations.
