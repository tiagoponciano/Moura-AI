-- Per-user quota on chat requests, so one account cannot run up the LLM bill
-- (see client/docs/chat-request-limits.md). The chat routes call
-- consume_chat_request() before they reach the model.

create table public.chat_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index chat_requests_user_created_idx
  on public.chat_requests (user_id, created_at desc);

-- No policies: rows are only written and counted by consume_chat_request().
alter table public.chat_requests enable row level security;

-- Records one chat request for the caller and returns true, or returns false
-- without recording it when the minute's or the day's quota is used up.
create function public.consume_chat_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  per_minute constant integer := 20;
  per_day constant integer := 500;
  caller uuid := auth.uid();
  last_minute integer;
  last_day integer;
begin
  if not public.is_approved() then
    raise exception 'Access not approved' using errcode = '42501';
  end if;

  -- Serializes concurrent requests of one user so the counts stay exact.
  perform pg_advisory_xact_lock(hashtext('chat_requests:' || caller::text));

  delete from public.chat_requests
  where user_id = caller and created_at < now() - interval '1 day';

  select
    count(*) filter (where created_at > now() - interval '1 minute'),
    count(*)
  into last_minute, last_day
  from public.chat_requests
  where user_id = caller;

  if last_minute >= per_minute or last_day >= per_day then
    return false;
  end if;

  insert into public.chat_requests (user_id) values (caller);
  return true;
end;
$$;

revoke execute on function public.consume_chat_request() from public, anon;
