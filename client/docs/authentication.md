# Authentication

How sign-in and access control work now: Google login through Supabase Auth, an admin-approval step, and the proxy that gates every page and API route. For developers setting up an environment or adding routes.

## What this is

Users sign in with Google on `/login`. Supabase Auth creates the user, and a database trigger creates a `profiles` row with `status = 'pending'`. `client/proxy.ts` runs before every matched request: it refreshes the session cookie, reads the profile status and either lets the request through or sends it to `/login`, `/pending` or `/unauthorized`. An admin approves users by updating `profiles.status`; there is no admin screen.

Invariants:

- **Auth is off when Supabase is not configured.** Without both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the proxy returns `NextResponse.next()` for everything, `/login` says login is not configured, and the app behaves as an open tool with no persistence.
- The proxy decides; the database enforces. Every table and the storage bucket have RLS that requires `auth.uid()` to own the row **and** `public.is_approved()`, so a request that slips past the proxy still reads and writes nothing.
- Users cannot approve themselves: `profiles` has a select policy for the owner and no update policy.

## Surface

### Routes

| Path             | Kind           | Layout                         | Who reaches it                                           |
| ---------------- | -------------- | ------------------------------ | -------------------------------------------------------- |
| `/login`         | page           | `app/(auth)/layout.tsx`        | Visitors without a session                               |
| `/pending`       | page           | `app/(auth)/layout.tsx`        | Signed-in users whose profile is `pending` or missing    |
| `/unauthorized`  | page           | `app/(auth)/layout.tsx`        | Signed-in users who are `rejected` or outside the domain |
| `/auth/callback` | `GET` handler  | —                              | Always allowed; Supabase redirects here with `?code=`    |
| everything else  | pages and APIs | `app/(app)/layout.tsx` (pages) | Approved users only, once Supabase is configured         |

`app/(auth)/layout.tsx` centers the card with the theme toggle in the corner and no sidebar. Module pages live under `app/(app)/`, whose layout holds the sidebar shell (see `app-shell.md`). Route groups do not change URLs.

Proxy matcher: every path except `_next/static`, `_next/image`, `favicon.ico`, `icon.png`, `brand/…` and paths ending in `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`. `/api/*` and `/templates/*` are gated.

### Library

| Export                          | File                     | Contract                                                                                                             |
| ------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `resolveGate(input)`            | `lib/auth/gate.ts`       | Pure; returns `{type:"allow"}`, `{type:"redirect",to}` or `{type:"deny",status,error}` (order below)                 |
| `isEmailAllowed(email, dom)`    | `lib/auth/gate.ts`       | `true` when `dom` is empty/undefined; else case-insensitive `endsWith("@" + dom)`, a leading `@` in `dom` is ignored |
| `AUTH_PATHS`                    | `lib/auth/gate.ts`       | `login`, `pending`, `unauthorized`, `callback` paths                                                                 |
| `signOut()`                     | `lib/auth/sign-out.ts`   | Browser-only; `supabase.auth.signOut()` then full reload on `/login`                                                 |
| `getSupabaseEnv()`              | `lib/supabase/env.ts`    | `{ url, anonKey }` or `undefined` when either variable is empty                                                      |
| `isSupabaseConfigured()`        | `lib/supabase/env.ts`    | `getSupabaseEnv() !== undefined`; usable in client and server code                                                   |
| `createSupabaseServerClient()`  | `lib/supabase/server.ts` | Server-only, one per request, acts as the signed-in user; `undefined` without env                                    |
| `createSupabaseBrowserClient()` | `lib/supabase/client.ts` | Browser singleton; `undefined` without env                                                                           |
| `refreshSession(request, env)`  | `lib/supabase/proxy.ts`  | Proxy-only; returns `user`, `supabase` and `respond`/`redirect`/`deny` that carry refreshed cookies                  |

`features/auth` exports `LoginCard`, `PendingCard`, `UnauthorizedCard` (client entry) and `handleAuthCallback` (server entry). `components/layout/user-menu.tsx` is the sidebar footer menu.

### Database (`supabase/migrations/20261013000000_profiles.sql`)

```sql
profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null unique,      -- lower-cased copy of auth.users.email
  name        text,                      -- Google full_name, else name; null if neither
  avatar_url  text,                      -- Google avatar_url
  status      user_status not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  role        user_role   not null default 'member',   -- 'admin' | 'member'
  approved_at timestamptz,               -- set by whoever approves; not maintained automatically
  approved_by uuid references profiles on delete set null,
  created_at  timestamptz not null default now()
)
```

- Trigger `on_auth_user_created` (after insert on `auth.users`) runs `handle_new_user()` (`security definer`) to insert the profile. It runs on insert only; later Google name or avatar changes do not update `profiles`.
- `public.is_approved()` (`security definer`, `stable`): `true` when the caller's profile exists with `status = 'approved'`. Every other RLS policy calls it.
- Policy `Users read their own profile`: `select` for `authenticated` where `id = auth.uid()`. No insert, update or delete policies.
- `role` is stored but nothing in the app reads it yet.

## Rules and behavior

### Gate resolution (`resolveGate`)

1. Path is exactly `/auth/callback` → allow.
2. Work out where the user belongs:
   - no session → `/login`;
   - email outside `ALLOWED_EMAIL_DOMAIN`, or `status = 'rejected'` → `/unauthorized`;
   - `status` is `pending` or the profile row is missing → `/pending`;
   - otherwise the user is approved and belongs nowhere in particular.
3. Approved user: path is `/login`, `/pending` or `/unauthorized` → redirect to `/`; any other path → allow.
4. Not approved, path starts with `/api/` → no redirect. Respond `401 {"error":"Authentication required"}` without a session, `403 {"error":"Access not approved"}` with one.
5. Not approved, path equals the place from step 2 → allow; otherwise redirect there.

| Session | Domain ok | `status`            | `/documents`      | `/login`          | `/api/chats` |
| ------- | --------- | ------------------- | ----------------- | ----------------- | ------------ |
| none    | —         | —                   | → `/login`        | allow             | 401          |
| yes     | no        | any                 | → `/unauthorized` | → `/unauthorized` | 403          |
| yes     | yes       | `rejected`          | → `/unauthorized` | → `/unauthorized` | 403          |
| yes     | yes       | `pending` or no row | → `/pending`      | → `/pending`      | 403          |
| yes     | yes       | `approved`          | allow             | → `/`             | allow        |

Rejected users go to `/unauthorized`, not `/pending`, deliberately: "aguardando aprovação" would be false for them.

### Proxy (`client/proxy.ts`)

1. No Supabase env → `NextResponse.next()`.
2. `refreshSession`: Supabase server client over the request cookies; `auth.getUser()` validates the token with Supabase Auth. Refreshed cookies are written to the request and to the response, with the no-cache headers Supabase supplies.
3. With a user, read `profiles.status` for `user.id` (RLS lets users read their own row). Missing row → `null`.
4. `resolveGate` with `ALLOWED_EMAIL_DOMAIN` read at request time.
5. Allow → the pass-through response; redirect → `NextResponse.redirect` to the target; deny → JSON with the status. Redirects and denials copy the refreshed cookies, so a token refresh is never lost.

Every gated request costs one Auth call and one `profiles` query.

### Sign-in

1. "Entrar com Google" calls `signInWithOAuth({ provider: "google", options: { redirectTo: <origin>/auth/callback } })`; the browser leaves for Google.
2. `/auth/callback` exchanges `code` for a session (`exchangeCodeForSession`), which sets the auth cookies, then redirects to `/`. The proxy applies the domain and approval checks on that next request.
3. Missing `code`, Supabase not configured or exchange error → redirect to `/login?error=auth_failed`, which shows "Não foi possível entrar. Tente novamente." The exchange error is logged as `Failed to exchange the OAuth code`.
4. If `signInWithOAuth` itself fails, the card shows "Não foi possível abrir o login do Google." and logs `Failed to start Google sign-in`.

### Signed-in UI

- Sidebar footer (`UserMenu`): avatar (Google `avatar_url`, initials of up to two words as fallback), name (`full_name` → `name` → email) and email from the Auth user metadata, not from `profiles`. The dropdown has "Sair". Renders nothing without Supabase or a session.
- `/pending` and `/unauthorized` show a "Sair e usar outra conta" button. Both sign-out paths call `signOut()`.

## What this does NOT do

- No admin UI, no approval e-mails, no notification when a user signs up. Approval is a SQL update.
- No sign-in method other than Google, and no `next` redirect back to the page the user first opened: after login everyone lands on `/`.
- `role` grants nothing; an `admin` has the same access as a `member`.
- The domain restriction is not stored anywhere: a user outside the domain still gets a `pending` profile row when they sign in, and is blocked only by the proxy check.
- Server Actions are not covered by a separate check (there are none); route handlers rely on the proxy plus RLS.

## Gotchas

- **Google sign-in returns to `/login?error=auth_failed`** → the exchange failed, usually because the redirect URL is not allowed in Supabase or the Site URL points elsewhere. → In Supabase, Authentication → URL Configuration: add `http://localhost:3000/auth/callback` and `https://<vercel-domain>/auth/callback` to Redirect URLs.
- **Everyone lands on `/pending`** → expected: new profiles are `pending`. → Approve with the SQL in Setup.
- **Env vars set on Vercel but the app still has no login** → `NEXT_PUBLIC_*` values are inlined at build time. → Redeploy after setting them. `ALLOWED_EMAIL_DOMAIN` is read at runtime, but redeploy anyway to be safe.
- **`curl` or a script gets `401` from `/api/documents/chat`** → the proxy gates API routes too once Supabase is configured. → Call it from a signed-in browser session, or unset the Supabase variables locally.
- **A page shows a stale user after token refresh** → Server Components cannot write cookies (`createSupabaseServerClient` swallows that error on purpose). → Keep the proxy matcher covering the page; it is what writes refreshed cookies.
- **Local development suddenly requires login** → `client/.env.local` has the Supabase variables. → Leave them empty to work without auth.
- **Approved in the dashboard but still on `/pending`** → the page was rendered before the update. → Reload; the proxy reads the status on every request.

## Setup

1. Create a Supabase project. Apply `supabase/migrations/*.sql` in filename order (SQL editor, or `supabase db push` with the Supabase CLI linked to the project).
2. Google Cloud console: create an OAuth client (Web). Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Providers → Google: paste the client ID and secret. The app itself never sees them.
4. Supabase → Authentication → URL Configuration: Site URL = the Vercel URL; Redirect URLs include `/auth/callback` on every origin used (localhost and Vercel).
5. Env vars (`client/.env.local` locally, Vercel project settings in production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `ALLOWED_EMAIL_DOMAIN` (e.g. `mourasengenharia.com`). Redeploy on Vercel.
6. Sign in once, then approve yourself in the SQL editor:

   ```sql
   update public.profiles
   set status = 'approved', role = 'admin', approved_at = now()
   where email = 'you@example.com';
   ```

   Approve others the same way (`role` can stay `member`); reject with `status = 'rejected'`.

7. Replace `client/lib/supabase/database.types.ts` with `supabase gen types typescript --project-id <ref>` output when the schema changes; until then it is maintained by hand to match the migrations.
