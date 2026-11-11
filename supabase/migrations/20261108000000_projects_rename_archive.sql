-- Approved users can rename a project and archive it. Archiving keeps the row
-- (nothing is deleted), because projects are shared by the whole team. Only
-- `name` and `archived_at` are writable, so `created_by` cannot be rewritten
-- through the API.

alter table public.projects add column archived_at timestamptz;

revoke update on public.projects from authenticated, anon;
grant update (name, archived_at) on public.projects to authenticated;

create policy "Approved users update projects"
  on public.projects for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());
