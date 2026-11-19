-- Files of a project: what was generated for it (forms, the proposal, converted plans)
-- and what was uploaded (a plan). The browser uploads to the private `project-files`
-- bucket under `<project_id>/`; the app then records the row. Shared by every approved
-- user, like projects. No update policy: a file is added or removed, not changed.
-- Keep the size limit in sync with client/lib/projects/files.ts.

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 26214400);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('form', 'proposal', 'plan', 'conversion', 'other')),
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (char_length(mime_type) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0),
  storage_path text not null unique
    check (split_part(storage_path, '/', 1) = project_id::text),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_files_project_idx
  on public.project_files (project_id, created_at desc);

alter table public.project_files enable row level security;

create policy "Approved users read project files"
  on public.project_files for select
  to authenticated
  using (public.is_approved());

create policy "Approved users add project files"
  on public.project_files for insert
  to authenticated
  with check (public.is_approved());

create policy "Approved users remove project files"
  on public.project_files for delete
  to authenticated
  using (public.is_approved());

create policy "Approved users read project file objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-files' and public.is_approved());

create policy "Approved users upload project file objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-files' and public.is_approved());

create policy "Approved users delete project file objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-files' and public.is_approved());
