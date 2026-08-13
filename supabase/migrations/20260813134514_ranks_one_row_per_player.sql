-- The ranks feed listed one row per ARENA PERSONA, so a login with several
-- Arena accounts appeared several times (sas3xo showed twice: Mythic on one
-- account, Platinum on the other). Profiles made a player a single identity —
-- both rows even link to the same profile — so the feed now lists one row per
-- PLAYER, showing their best rank in each format.

-- Orders a rank side the way the client does (sortRanks.ts): class first,
-- then level (1 is best) and step for everyone below Mythic, then leaderboard
-- place (any place beats none, lower is better), then percentile. Each term
-- gets its own magnitude band so the comparison stays lexicographic.
create or replace function public.rank_score(side jsonb)
returns numeric
language sql
immutable
as $$
  select case
    when side is null then -1
    else
      -- class
      (case side ->> 'class'
        when 'Bronze' then 1
        when 'Silver' then 2
        when 'Gold' then 4
        when 'Platinum' then 8
        when 'Diamond' then 16
        when 'Mythic' then 32
        else 0
      end)::numeric * 1e15
      -- level/step, skipped for Mythic exactly as the client skips it
      + case when side ->> 'class' = 'Mythic' then 0 else (
          (5 - least(greatest(coalesce((side ->> 'level')::numeric, 4), 1), 4)) * 10
          + least(greatest(coalesce((side ->> 'step')::numeric, 0), 0), 9)
        ) * 1e12 end
      -- having a leaderboard place at all
      + case when coalesce((side ->> 'leaderboardPlace')::numeric, 0) > 0
          then 1e11 else 0 end
      -- lower place is better
      + case when coalesce((side ->> 'leaderboardPlace')::numeric, 0) > 0
          then (1000000 - least((side ->> 'leaderboardPlace')::numeric, 999999)) * 1e4
          else 0 end
      -- percentile, higher is better
      + least(greatest(coalesce((side ->> 'percentile')::numeric, 0), 0), 100)
  end
$$;

create or replace function public.get_latest_ranks(p_limit integer default 100)
returns table(
  arena_id text,
  display_name text,
  username text,
  avatar_url text,
  constructed jsonb,
  limited jsonb,
  updated_at timestamp with time zone
)
language sql
security definer
set search_path = public
stable
as $$
  with per_account as (
    -- Latest rank per arena persona, resolved to a single owning account (an
    -- arena_id can be claimed by more than one login), private profiles
    -- excluded. "Spark" is the placeholder a failed rank read wrote.
    select distinct on (r.arena_id)
      r.arena_id, a.display_name, a.user_id, a.last_seen_at,
      r.constructed, r.limited, r.updated_at
    from arena_ranks r
    join lateral (
      select a2.display_name, a2.user_id, a2.last_seen_at
      from arena_accounts a2
      where a2.arena_id = r.arena_id
      order by a2.last_seen_at desc
      limit 1
    ) a on true
    left join profiles p on p.id = a.user_id
    where coalesce(p.is_private, false) = false
      and coalesce(r.constructed ->> 'class', '') <> 'Spark'
    order by r.arena_id, r.updated_at desc
  ),
  -- Which account represents the player: the one their profile shows, so the
  -- row and the profile it links to agree on identity.
  identity as (
    select distinct on (pa.user_id) pa.user_id, pa.arena_id, pa.display_name
    from per_account pa
    left join profiles p on p.id = pa.user_id
    order by pa.user_id,
             (pa.arena_id = p.visible_arena_id) desc nulls last,
             pa.last_seen_at desc
  ),
  -- Each format independently: a player's best constructed and best limited
  -- can live on different accounts.
  best_constructed as (
    select distinct on (user_id) user_id, constructed
    from per_account
    order by user_id, rank_score(constructed) desc, updated_at desc
  ),
  best_limited as (
    select distinct on (user_id) user_id, limited
    from per_account
    order by user_id, rank_score(limited) desc, updated_at desc
  ),
  -- Recency for the feed's own cut: as fresh as the player's freshest account.
  freshest as (
    select user_id, max(updated_at) as updated_at
    from per_account
    group by user_id
  )
  select i.arena_id, i.display_name,
         coalesce(p.display_name, p.username) as username,
         p.avatar_url,
         bc.constructed, bl.limited, f.updated_at
  from identity i
  join best_constructed bc on bc.user_id = i.user_id
  join best_limited bl on bl.user_id = i.user_id
  join freshest f on f.user_id = i.user_id
  left join profiles p on p.id = i.user_id
  order by f.updated_at desc
  limit greatest(1, least(p_limit, 300))
$$;
