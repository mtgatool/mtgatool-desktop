-- Two fixes for the ranks feed, one cause: the "default" placeholder.
--
-- Before the tracker parses MTGA's authenticateResponse line it has no
-- playerId, and early rank reads uploaded under the literal arena id
-- "default" — a placeholder 60 logins have claimed, with 13 rank rows from
-- 13 different people. The feed modeled each arena_id as one persona owned
-- by its latest claimant, so one player's name wore another player's rank.
--
-- 1. Rank rows are attributed to the login that WROTE them: arena_ranks'
--    key is (user_id, arena_id), ownership was always unambiguous — the
--    lateral re-derivation from arena_accounts is what invented the shared
--    owner (and was the feed's most expensive node).
-- 2. Placeholder rows are ignored outright; the client stops uploading
--    them, and the stragglers already in the table stay invisible.

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
    select r.user_id, r.arena_id, a.display_name, a.last_seen_at,
           r.constructed, r.limited, r.updated_at
    from arena_ranks r
    left join arena_accounts a
      on a.user_id = r.user_id and a.arena_id = r.arena_id
    left join profiles p on p.id = r.user_id
    where coalesce(p.is_private, false) = false
      and coalesce(r.constructed ->> 'class', '') <> 'Spark'
      and r.arena_id <> 'default'
  ),
  -- Which account represents the player: the pinned one, else their best
  -- ranked, so a row and the profile it links to agree on identity.
  identity as (
    select distinct on (pa.user_id) pa.user_id, pa.arena_id, pa.display_name
    from per_account pa
    left join profiles p on p.id = pa.user_id
    order by pa.user_id,
             (pa.arena_id = p.visible_arena_id) desc nulls last,
             greatest(rank_score(pa.constructed), rank_score(pa.limited))
               desc nulls last,
             pa.last_seen_at desc nulls last
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
