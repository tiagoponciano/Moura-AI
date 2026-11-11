-- The data a project shares across its forms, keyed by PROJECT_FIELD_KEYS
-- (see client/features/documents/docs/project-fields.md).

alter table public.projects
  add column data jsonb not null default '{}';

create policy "Approved users update projects"
  on public.projects for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());
