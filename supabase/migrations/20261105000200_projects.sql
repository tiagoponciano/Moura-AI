-- Projects group the forms filled for one job. Shared by every approved user,
-- because the team works on the same jobs. No delete policy.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Approved users read projects"
  on public.projects for select
  to authenticated
  using (public.is_approved());

create policy "Approved users add projects"
  on public.projects for insert
  to authenticated
  with check (public.is_approved());
