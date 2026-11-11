# Supabase keep-alive

How the project stays active on the free Supabase plan. It is for whoever maintains the repository settings or debugs a paused project.

## What this is

The free Supabase plan pauses a project after 7 days without activity, and while it is paused nobody can sign in. The workflow `.github/workflows/supabase-keep-alive.yml` runs once a day at 09:17 UTC and reads one row from `public.profiles` through the REST API with the public anon key. The anon key has no session, so row level security returns `[]`; the request still counts as activity.

## Setup

Create two repository secrets (Settings → Secrets and variables → Actions). They hold the same values as the `NEXT_PUBLIC_` variables of the app:

| Secret              | Value                           |
| ------------------- | ------------------------------- |
| `SUPABASE_URL`      | `NEXT_PUBLIC_SUPABASE_URL`      |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

The service-role key is never used here.

## Behavior

- The job fails when either secret is missing, when the request does not answer `2xx` within 30 seconds (3 retries, 10 seconds apart), or when the project is paused.
- Scheduled workflows run only from the default branch (`main`).
- GitHub disables scheduled workflows after 60 days without repository activity. Re-enable it in the Actions tab if that happens.
- To run it on demand: Actions → Supabase keep-alive → Run workflow.
