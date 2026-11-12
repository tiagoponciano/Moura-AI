-- The project routes update `data` (the project's shared fields) with the
-- user's session, but 20261108000000 granted UPDATE only on (name, archived_at).
-- Add `data` so those updates are not rejected with 42501. `created_by` stays
-- unwritable through the API.

grant update (name, archived_at, data) on public.projects to authenticated;
