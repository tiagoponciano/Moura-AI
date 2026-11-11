-- Who changed which shared data of a project, and when. Written only by a
-- trigger on projects; approved users can read it, nobody writes it directly.

create table public.project_changes (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  changed_by uuid references public.profiles (id) on delete set null,
  -- Profiles are readable only by their owner, so the name is copied here.
  changed_by_name text,
  changed_at timestamptz not null default now()
);

create index project_changes_project_idx
  on public.project_changes (project_id, changed_at desc);

alter table public.project_changes enable row level security;

create policy "Approved users read project changes"
  on public.project_changes for select
  to authenticated
  using (public.is_approved());

create function public.log_project_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_name text;
  changed_key text;
begin
  select coalesce(nullif(btrim(p.name), ''), p.email)
    into author_name
    from public.profiles p
    where p.id = auth.uid();

  if new.name is distinct from old.name then
    insert into public.project_changes
      (project_id, field, old_value, new_value, changed_by, changed_by_name)
    values (new.id, 'name', old.name, new.name, auth.uid(), author_name);
  end if;

  for changed_key in
    select k
    from (
      select jsonb_object_keys(old.data) as k
      union
      select jsonb_object_keys(new.data) as k
    ) keys
    where (old.data ->> k) is distinct from (new.data ->> k)
    order by k
  loop
    insert into public.project_changes
      (project_id, field, old_value, new_value, changed_by, changed_by_name)
    values (
      new.id,
      changed_key,
      old.data ->> changed_key,
      new.data ->> changed_key,
      auth.uid(),
      author_name
    );
  end loop;
  return new;
end;
$$;

create trigger projects_log_changes
  after update on public.projects
  for each row
  when (old.name is distinct from new.name or old.data is distinct from new.data)
  execute function public.log_project_changes();
