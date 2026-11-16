-- The classification of a project: the answers, occupations, enlargement and
-- construction faults the assistant and the panel hold, saved so the
-- classification reopens where it stopped. Inputs only; the result is computed
-- again from them. Shared by every approved user, like projects. No delete policy.

create table public.project_classifications (
  project_id uuid primary key references public.projects (id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create function public.touch_project_classification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger project_classifications_touch
  before insert or update on public.project_classifications
  for each row execute function public.touch_project_classification();

alter table public.project_classifications enable row level security;

create policy "Approved users read classifications"
  on public.project_classifications for select
  to authenticated
  using (public.is_approved());

create policy "Approved users add classifications"
  on public.project_classifications for insert
  to authenticated
  with check (public.is_approved());

create policy "Approved users update classifications"
  on public.project_classifications for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());
