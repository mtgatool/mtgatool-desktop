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
  -- One row per arena persona: latest non-bogus rank, resolved to a single
  -- account (an arena_id can be claimed by more than one login), private
  -- profiles excluded. "Spark" is the placeholder a failed rank read wrote.
  select s.arena_id, s.display_name, s.username, s.avatar_url,
         s.constructed, s.limited, s.updated_at
  from (
    select distinct on (r.arena_id)
      r.arena_id, a.display_name, p.username, p.avatar_url,
      r.constructed, r.limited, r.updated_at
    from arena_ranks r
    join lateral (
      select a2.display_name, a2.user_id
      from arena_accounts a2
      where a2.arena_id = r.arena_id
      order by a2.last_seen_at desc
      limit 1
    ) a on true
    left join profiles p on p.id = a.user_id
    where coalesce(p.is_private, false) = false
      and coalesce(r.constructed->>'class', '') <> 'Spark'
    order by r.arena_id, r.updated_at desc
  ) s
  order by s.updated_at desc
  limit greatest(1, least(p_limit, 300))
$$;
