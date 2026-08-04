-- One row per account. Deliberately minimal: the tracker only needs a
-- public username; everything else (email is synthetic, no real PII).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_-]{3,24}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Usernames are public (shown on community features like leaderboards)
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- Only the owner can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Profile rows are created by the signup trigger only (security definer),
-- so no insert policy is exposed to clients.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user-' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
