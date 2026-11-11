-- A project's answers to the PPCI review checklist: one row per item, with who
-- answered and when. Shared by every approved user. No delete policy.

create table public.ppci_answers (
  project_id uuid not null references public.projects (id) on delete cascade,
  checklist_version text not null,
  group_position smallint not null,
  item_position smallint not null,
  status text check (status in ('atende', 'adequar', 'na')),
  note text check (note is null or char_length(note) <= 2000),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_by_name text,
  updated_at timestamptz not null default now(),
  primary key (project_id, checklist_version, group_position, item_position),
  foreign key (checklist_version, group_position, item_position)
    references public.ppci_checklist_items (checklist_version, group_position, position)
);

-- Profiles are readable only by their owner, so the name is copied here.
create function public.touch_ppci_answer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.updated_by_name := (
    select coalesce(nullif(btrim(p.name), ''), p.email)
    from public.profiles p
    where p.id = auth.uid()
  );
  return new;
end;
$$;

create trigger ppci_answers_touch
  before insert or update on public.ppci_answers
  for each row execute function public.touch_ppci_answer();

alter table public.ppci_answers enable row level security;

create policy "Approved users read answers"
  on public.ppci_answers for select
  to authenticated
  using (public.is_approved());

create policy "Approved users add answers"
  on public.ppci_answers for insert
  to authenticated
  with check (public.is_approved());

create policy "Approved users update answers"
  on public.ppci_answers for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());
