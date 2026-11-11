-- What was filled in each form of a project, saved so a form reopens where it
-- stopped. Shared by every approved user, like projects. No delete policy.

create table public.form_fillings (
  project_id uuid not null references public.projects (id) on delete cascade,
  template_id text not null check (template_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  values jsonb not null default '{}'::jsonb check (jsonb_typeof(values) = 'object'),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (project_id, template_id)
);

create function public.touch_form_filling()
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

create trigger form_fillings_touch
  before insert or update on public.form_fillings
  for each row execute function public.touch_form_filling();

alter table public.form_fillings enable row level security;

create policy "Approved users read fillings"
  on public.form_fillings for select
  to authenticated
  using (public.is_approved());

create policy "Approved users add fillings"
  on public.form_fillings for insert
  to authenticated
  with check (public.is_approved());

create policy "Approved users update fillings"
  on public.form_fillings for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());
