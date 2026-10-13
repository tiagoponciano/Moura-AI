-- One profile per Supabase Auth user. New users start as pending members;
-- an admin approves them by updating `status` (see client/docs/authentication.md).

create type public.user_status as enum ('pending', 'approved', 'rejected');
create type public.user_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  avatar_url text,
  status public.user_status not null default 'pending',
  role public.user_role not null default 'member',
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used by every RLS policy that requires an approved user.
create function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

alter table public.profiles enable row level security;

-- Read-only for the owner: there is no update policy, so users cannot approve themselves.
create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());
