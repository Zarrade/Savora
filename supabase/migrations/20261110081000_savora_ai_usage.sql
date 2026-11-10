-- Per-user daily count of AI requests made through the shared (free) OpenRouter key.
-- Only the ai Edge Function (service role) reads or writes it: RLS on, no policies (intentional).
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  count   integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

-- Atomically add one request; returns the new count for today.
create function public.bump_ai_usage(uid uuid) returns integer
language sql security invoker set search_path = '' as $$
  insert into public.ai_usage as a (user_id, day, count)
  values (uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = a.count + 1
  returning count;
$$;
revoke all on function public.bump_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.bump_ai_usage(uuid) to service_role;
