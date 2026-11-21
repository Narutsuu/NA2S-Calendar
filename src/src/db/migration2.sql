alter table profiles add column if not exists theme text not null default 'dark';
alter table profiles add column if not exists week_start int not null default 1;
alter table profiles add column if not exists timezone text not null default 'Europe/Paris';
alter table profiles add column if not exists notify boolean not null default true;
alter table events add column if not exists recurrence text not null default 'none';
alter table events add column if not exists remind_min int;

create or replace function delete_my_account() returns void language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function delete_my_account() from public;
grant execute on function delete_my_account() to authenticated;
