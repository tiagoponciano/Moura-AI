-- Files attached to chats. The browser uploads straight to the private
-- `attachments` bucket under `<user_id>/`; the app then records the row.
-- Size and type limits live in the bucket so they hold even if the client is bypassed;
-- keep them in sync with client/lib/attachments/rules.ts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- No foreign key: a file can be attached before the chat's first exchange is saved.
  chat_id uuid,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index attachments_user_chat_idx on public.attachments (user_id, chat_id);

alter table public.attachments enable row level security;

create policy "Approved users manage their own attachments"
  on public.attachments for all
  to authenticated
  using (user_id = auth.uid() and public.is_approved())
  with check (
    user_id = auth.uid()
    and public.is_approved()
    and split_part(storage_path, '/', 1) = auth.uid()::text
  );

create policy "Approved users read their own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_approved()
  );

create policy "Approved users upload into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_approved()
  );

create policy "Approved users delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_approved()
  );
