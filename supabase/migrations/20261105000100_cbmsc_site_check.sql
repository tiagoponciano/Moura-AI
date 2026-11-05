-- The latest reading of the CBMSC forms page: what the site listed, not what
-- differs from the catalog. The console compares it to cbmsc_forms when it
-- reads it (see client/docs/cbmsc-forms-catalog.md).

create table public.cbmsc_site_check (
  id boolean primary key default true check (id),
  checked_at timestamptz not null,
  status text not null check (status in ('complete', 'partial', 'failed')),
  failures integer not null check (failures >= 0),
  forms jsonb not null
);

alter table public.cbmsc_site_check enable row level security;

create policy "Admins read the site check"
  on public.cbmsc_site_check for select
  to authenticated
  using (public.is_admin());

create policy "Admins add the site check"
  on public.cbmsc_site_check for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update the site check"
  on public.cbmsc_site_check for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
