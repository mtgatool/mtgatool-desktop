-- Server-side opt-out flag for the public feed (private mode).
alter table public.profiles add column if not exists is_private boolean not null default false;

-- Public latest ranks across users (showcase feed). Security-definer so it can
-- read arena_ranks/arena_accounts past their per-user RLS, but it only exposes
-- public fields and excludes anyone in private mode.
create or replace function public.get_latest_ranks(p_limit int default 100)
returns table (
  arena_id text,
  display_name text,
  username text,
  avatar_url text,
  constructed jsonb,
  limited jsonb,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.arena_id, a.display_name, p.username, p.avatar_url,
         r.constructed, r.limited, r.updated_at
  from arena_ranks r
  join arena_accounts a on a.arena_id = r.arena_id
  left join profiles p on p.id = a.user_id
  where coalesce(p.is_private, false) = false
  order by r.updated_at desc
  limit greatest(1, least(p_limit, 300))
$$;
grant execute on function public.get_latest_ranks(int) to anon, authenticated;

-- Resolve public profile (name/avatar) for a set of arena personas — e.g. the
-- opponent during a match. Private-mode users resolve to nothing (-> default).
create or replace function public.get_public_profiles(p_arena_ids text[])
returns table (arena_id text, display_name text, username text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select a.arena_id, a.display_name, p.username, p.avatar_url
  from arena_accounts a
  left join profiles p on p.id = a.user_id
  where a.arena_id = any(p_arena_ids)
    and coalesce(p.is_private, false) = false
$$;
grant execute on function public.get_public_profiles(text[]) to anon, authenticated;
