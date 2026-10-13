-- The allowed e-mail domain was only checked by client/proxy.ts. Checking it
-- in is_approved() and is_admin() makes every RLS policy and admin RPC refuse
-- accounts outside it too, even when called straight through the Supabase API.
-- The ALLOWED_EMAIL_DOMAIN fallback lives only in the app, so it is not covered.

-- Mirrors isEmailAllowed in client/lib/auth/gate.ts: an empty domain allows everyone.
create function public.email_in_domain(email text, domain text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select d = '' or right(lower(email), length(d) + 1) = '@' || d
  from (select lower(ltrim(btrim(coalesce(domain, '')), '@')) as d) as normalized;
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.app_settings a on true
    where p.id = auth.uid()
      and p.status = 'approved'
      and public.email_in_domain(p.email, a.allowed_email_domain)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.app_settings a on true
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role = 'admin'
      and public.email_in_domain(p.email, a.allowed_email_domain)
  );
$$;
