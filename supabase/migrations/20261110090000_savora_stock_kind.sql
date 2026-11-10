-- "At home" items (what the user already has) sync like other records
alter table public.user_records drop constraint user_records_kind_check;
alter table public.user_records add constraint user_records_kind_check
  check (kind in ('recipe', 'plan', 'grocery', 'collection', 'settings', 'stock'));
