create table profiles (id uuid primary key references auth.users on delete cascade, username text);
create table categories (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, name text not null, color text not null default '#7c3aed');
create table events (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, title text not null, description text, location text, color text not null default '#7c3aed', category_id uuid references categories on delete set null, start_at timestamptz not null, end_at timestamptz not null);
create table tasks (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, title text not null, due_date date, priority text not null default 'normal', done boolean not null default false, category_id uuid references categories on delete set null);

alter table profiles enable row level security;
alter table categories enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
create policy own_profile on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy own_categories on categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_events on events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_tasks on tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username) values (new.id, new.raw_user_meta_data->>'username');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
