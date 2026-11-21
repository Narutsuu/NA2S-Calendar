create table calendar_shares (
  owner_id uuid not null references auth.users on delete cascade,
  member_id uuid not null references auth.users on delete cascade,
  can_edit boolean not null default false,
  primary key (owner_id, member_id)
);
alter table calendar_shares enable row level security;
create policy shares_owner on calendar_shares for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy shares_member_read on calendar_shares for select using (member_id = auth.uid());
create policy shares_member_leave on calendar_shares for delete using (member_id = auth.uid());

drop policy own_events on events;
create policy events_select on events for select using (
  user_id = auth.uid() or exists (select 1 from calendar_shares s where s.owner_id = events.user_id and s.member_id = auth.uid()));
create policy events_insert on events for insert with check (user_id = auth.uid());
create policy events_update on events for update
  using (user_id = auth.uid() or exists (select 1 from calendar_shares s where s.owner_id = events.user_id and s.member_id = auth.uid() and s.can_edit))
  with check (user_id = auth.uid() or exists (select 1 from calendar_shares s where s.owner_id = events.user_id and s.member_id = auth.uid() and s.can_edit));
create policy events_delete on events for delete
  using (user_id = auth.uid() or exists (select 1 from calendar_shares s where s.owner_id = events.user_id and s.member_id = auth.uid() and s.can_edit));

create policy profiles_shared_read on profiles for select using (exists (
  select 1 from calendar_shares s where (s.owner_id = profiles.id and s.member_id = auth.uid()) or (s.member_id = profiles.id and s.owner_id = auth.uid())));

create function share_calendar(member_email text, edit boolean) returns void language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  select id into mid from auth.users where lower(email) = lower(member_email);
  if mid is null then raise exception 'Aucun compte avec cet e-mail'; end if;
  if mid = auth.uid() then raise exception 'Impossible de partager avec vous-même'; end if;
  insert into calendar_shares (owner_id, member_id, can_edit) values (auth.uid(), mid, edit)
  on conflict (owner_id, member_id) do update set can_edit = excluded.can_edit;
end $$;
revoke all on function share_calendar(text, boolean) from public;
grant execute on function share_calendar(text, boolean) to authenticated;
