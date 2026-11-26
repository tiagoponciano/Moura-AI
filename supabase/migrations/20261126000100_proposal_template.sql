-- The deck the commercial proposal is filled from. Without a row here the app uses the
-- one bundled in client/public/templates/proposal. One row at most; the file is the
-- object `proposal.pptx` of the private `proposal-template` bucket. Every approved user
-- reads it (the proposal route fills it with their session); only admins change it.
-- Keep the size limit in sync with client/features/documents/lib/proposal-template.ts.

insert into storage.buckets (id, name, public, file_size_limit)
values ('proposal-template', 'proposal-template', false, 20971520);

create table public.proposal_template (
  id boolean primary key default true check (id),
  file_name text not null check (char_length(file_name) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default now()
);

alter table public.proposal_template enable row level security;

create policy "Approved users read the proposal template"
  on public.proposal_template for select
  to authenticated
  using (public.is_approved());

create policy "Admins write the proposal template"
  on public.proposal_template for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Approved users read the proposal template file"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'proposal-template' and public.is_approved());

create policy "Admins add the proposal template file"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'proposal-template' and public.is_admin());

create policy "Admins replace the proposal template file"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'proposal-template' and public.is_admin())
  with check (bucket_id = 'proposal-template' and public.is_admin());

create policy "Admins delete the proposal template file"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'proposal-template' and public.is_admin());
