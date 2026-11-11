-- Moura's PPCI review checklist, imported from its spreadsheet as numbered
-- versions (see client/docs/ppci-checklist.md). Seed migrations insert each
-- version; the app only reads it.

create table public.ppci_checklists (
  version text primary key check (version ~ '^v[0-9]+$'),
  created_at timestamptz not null default now()
);

create table public.ppci_checklist_groups (
  checklist_version text not null references public.ppci_checklists (version) on delete cascade,
  position smallint not null check (position > 0),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  primary key (checklist_version, position)
);

create table public.ppci_checklist_items (
  checklist_version text not null,
  group_position smallint not null,
  position smallint not null check (position > 0),
  section text check (section is null or char_length(btrim(section)) between 1 and 200),
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  reference text check (reference is null or char_length(btrim(reference)) between 1 and 100),
  primary key (checklist_version, group_position, position),
  foreign key (checklist_version, group_position)
    references public.ppci_checklist_groups (checklist_version, position) on delete cascade
);

alter table public.ppci_checklists enable row level security;
alter table public.ppci_checklist_groups enable row level security;
alter table public.ppci_checklist_items enable row level security;

create policy "Approved users read checklists"
  on public.ppci_checklists for select
  to authenticated
  using (public.is_approved());

create policy "Approved users read checklist groups"
  on public.ppci_checklist_groups for select
  to authenticated
  using (public.is_approved());

create policy "Approved users read checklist items"
  on public.ppci_checklist_items for select
  to authenticated
  using (public.is_approved());
