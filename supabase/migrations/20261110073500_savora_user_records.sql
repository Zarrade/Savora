-- Savora: every user's recipes, plan, groceries, collections and settings.
-- One generic table keeps sync simple; RLS restricts each row to its owner.
create table public.user_records (
  user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text    not null check (kind in ('recipe', 'plan', 'grocery', 'collection', 'settings')),
  id         text    not null check (char_length(id) between 1 and 200),
  data       jsonb,
  client_ts  bigint  not null default 0,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

create index user_records_user_updated_idx on public.user_records (user_id, updated_at);

alter table public.user_records enable row level security;

create policy "Users read their own records" on public.user_records
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users insert their own records" on public.user_records
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own records" on public.user_records
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete their own records" on public.user_records
  for delete to authenticated using (user_id = (select auth.uid()));

-- Server time is the sync cursor (clients' clocks can't be trusted for ordering)
create function public.user_records_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger user_records_touch before insert or update on public.user_records
  for each row execute function public.user_records_touch();

-- Batched push with last-write-wins on the client's edit time. Runs as the caller (RLS applies).
create function public.push_records(records jsonb) returns integer
language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  if jsonb_typeof(records) <> 'array' or jsonb_array_length(records) > 500 then
    raise exception 'records must be an array of at most 500 items';
  end if;
  insert into public.user_records as t (user_id, kind, id, data, client_ts, deleted)
  select auth.uid(), r.kind, r.id, case when coalesce(r.deleted, false) then null else r.data end, coalesce(r.client_ts, 0), coalesce(r.deleted, false)
  from jsonb_to_recordset(records) as r(kind text, id text, data jsonb, client_ts bigint, deleted boolean)
  on conflict (user_id, kind, id) do update
    set data = excluded.data, client_ts = excluded.client_ts, deleted = excluded.deleted
    where excluded.client_ts >= t.client_ts;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.push_records(jsonb) from public, anon;
grant execute on function public.push_records(jsonb) to authenticated;

-- Let a signed-in user delete their own account (and, by cascade, all their data).
-- SECURITY DEFINER is intentional: it can only ever delete auth.uid() itself.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Live updates between a user's devices
alter publication supabase_realtime add table public.user_records;
