-- Admin console: admins manage user access, pick the AI provider and model,
-- store provider API keys in Supabase Vault and set the allowed e-mail domain
-- (see client/features/admin/docs/admin-console.md).

create extension if not exists supabase_vault;

create type public.llm_provider as enum ('anthropic', 'openai', 'google');

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved' and role = 'admin'
  );
$$;

create policy "Admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Profiles stay without an update policy: access changes go through these
-- functions, which refuse non-admins and refuse the admin's own row.
create function public.admin_set_user_status(
  target uuid,
  new_status public.user_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'Admins cannot change their own access' using errcode = '22023';
  end if;

  update public.profiles
  set status = new_status,
      approved_at = case when new_status = 'approved' then now() end,
      approved_by = case when new_status = 'approved' then auth.uid() end
  where id = target;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

create function public.admin_set_user_role(
  target uuid,
  new_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'Admins cannot change their own access' using errcode = '22023';
  end if;

  update public.profiles set role = new_role where id = target;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Single-row table: `id` can only be true.
create table public.app_settings (
  id boolean primary key default true check (id),
  llm_provider public.llm_provider,
  llm_model text,
  allowed_email_domain text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.app_settings default values;

create function public.touch_app_settings()
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

create trigger app_settings_touch
  before update on public.app_settings
  for each row execute function public.touch_app_settings();

alter table public.app_settings enable row level security;

create policy "Admins read app settings"
  on public.app_settings for select
  to authenticated
  using (public.is_admin());

create policy "Admins update app settings"
  on public.app_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- One Vault secret per provider, named `llm_api_key_<provider>`.
create function public.admin_set_provider_key(
  provider public.llm_provider,
  api_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_name text := 'llm_api_key_' || provider::text;
  trimmed text := btrim(coalesce(api_key, ''));
  existing uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if trimmed = '' then
    raise exception 'API key is empty' using errcode = '22023';
  end if;

  select s.id into existing from vault.secrets s where s.name = secret_name;
  if existing is null then
    perform vault.create_secret(trimmed, secret_name, 'LLM API key set from the admin console');
  else
    perform vault.update_secret(existing, trimmed);
  end if;
end;
$$;

-- Never returns a key: only its last four characters.
create function public.admin_list_provider_keys()
returns table (provider public.llm_provider, last_four text, updated_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  return query
    select p.value, right(s.decrypted_secret, 4), s.updated_at
    from unnest(enum_range(null::public.llm_provider)) as p (value)
    join vault.decrypted_secrets s on s.name = 'llm_api_key_' || p.value::text;
end;
$$;

-- Server-only (service role): returns the decrypted key.
create function public.get_llm_config()
returns table (provider public.llm_provider, model text, api_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.llm_provider, a.llm_model, s.decrypted_secret
  from public.app_settings a
  left join vault.decrypted_secrets s
    on s.name = 'llm_api_key_' || a.llm_provider::text
  where a.llm_provider is not null and a.llm_model is not null;
$$;

-- Everything the proxy needs in one call. Always one row; `status` and `role`
-- are null when the caller has no profile.
create function public.get_gate_state()
returns table (
  status public.user_status,
  role public.user_role,
  allowed_email_domain text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.status, p.role, a.allowed_email_domain
  from (select 1) as one
  left join public.profiles p on p.id = auth.uid()
  left join public.app_settings a on true;
$$;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.admin_set_user_status(uuid, public.user_status) from public, anon;
revoke execute on function public.admin_set_user_role(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_set_provider_key(public.llm_provider, text) from public, anon;
revoke execute on function public.admin_list_provider_keys() from public, anon;
revoke execute on function public.get_gate_state() from public, anon;
revoke execute on function public.get_llm_config() from public, anon, authenticated;
grant execute on function public.get_llm_config() to service_role;
