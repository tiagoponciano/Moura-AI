-- Who may use each AI provider. The admin console still picks one default model;
-- a provider marked `restricted` is used only by the users listed for it, and
-- everyone else falls back to the next provider they may use.

create table public.llm_provider_settings (
  provider public.llm_provider primary key,
  -- The model used when this provider is not the default one.
  model text,
  restricted boolean not null default false
);

create table public.llm_provider_access (
  provider public.llm_provider not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (provider, user_id)
);

alter table public.llm_provider_settings enable row level security;
alter table public.llm_provider_access enable row level security;

create policy "Admins read provider settings"
  on public.llm_provider_settings for select using (public.is_admin());
create policy "Admins write provider settings"
  on public.llm_provider_settings for all
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins read provider access"
  on public.llm_provider_access for select using (public.is_admin());

insert into public.llm_provider_settings (provider, model)
select p.value, case when a.llm_provider = p.value then a.llm_model end
from unnest(enum_range(null::public.llm_provider)) as p (value)
left join public.app_settings a on true;

-- Replaces who may use a provider; admin only, in one transaction.
create function public.admin_set_provider_access(
  target public.llm_provider,
  is_restricted boolean,
  user_ids uuid[]
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

  insert into public.llm_provider_settings (provider, restricted)
  values (target, is_restricted)
  on conflict (provider) do update set restricted = excluded.restricted;

  delete from public.llm_provider_access a where a.provider = target;
  insert into public.llm_provider_access (provider, user_id)
  select target, u
  from unnest(coalesce(user_ids, '{}')) as u
  join public.profiles p on p.id = u;
end;
$$;

-- Server-only (service role): the model and key this user may use. The default
-- provider comes first, then OpenAI, then the others; a provider needs a model
-- and a key, and a restricted one needs the user to be listed.
create function public.get_llm_config_for(user_id uuid)
returns table (provider public.llm_provider, model text, api_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.value,
         case when a.llm_provider = p.value then a.llm_model else s.model end,
         k.decrypted_secret
  from unnest(enum_range(null::public.llm_provider)) as p (value)
  left join public.app_settings a on true
  left join public.llm_provider_settings s on s.provider = p.value
  join vault.decrypted_secrets k on k.name = 'llm_api_key_' || p.value::text
  where case when a.llm_provider = p.value then a.llm_model else s.model end is not null
    and (
      not coalesce(s.restricted, false)
      or exists (
        select 1 from public.llm_provider_access x
        where x.provider = p.value and x.user_id = get_llm_config_for.user_id
      )
    )
  order by (a.llm_provider = p.value) desc nulls last, (p.value = 'openai') desc
  limit 1;
$$;

revoke execute on function public.admin_set_provider_access(public.llm_provider, boolean, uuid[]) from public, anon;
revoke execute on function public.get_llm_config_for(uuid) from public, anon, authenticated;
grant execute on function public.get_llm_config_for(uuid) to service_role;
