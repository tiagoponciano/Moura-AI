-- Which floor plans were converted for a project: the file name, the mode the
-- service used, the scale and the format. A record of the conversion, not the
-- files. Shared by every approved user, like projects. No update or delete policy.

create table public.project_floor_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mode text not null check (mode in ('vector', 'raster')),
  scale integer check (scale between 1 and 5000),
  format text not null check (format in ('dxf', 'dwg')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_floor_plans_project_idx
  on public.project_floor_plans (project_id, created_at desc);

alter table public.project_floor_plans enable row level security;

create policy "Approved users read floor plans"
  on public.project_floor_plans for select
  to authenticated
  using (public.is_approved());

create policy "Approved users add floor plans"
  on public.project_floor_plans for insert
  to authenticated
  with check (public.is_approved());
