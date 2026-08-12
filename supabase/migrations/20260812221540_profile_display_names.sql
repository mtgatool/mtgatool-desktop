-- Signup keeps the pretty username the user typed ("Manwë") in the auth
-- metadata and derives a lowercase ASCII login id ("manwe") from it; the
-- profiles trigger only ever copied the login id, so every public surface
-- showed the folded name. Store the pretty one on the profile, backfill it
-- from auth metadata, and make the public reads prefer it.
--
-- Also: profile match lists and the public match page now carry the
-- opponent's in-game name, and profile lookups by name accept the display
-- name as well as the login id.

alter table public.profiles
  add column if not exists display_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user-' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$;

update public.profiles p
set display_name = u.raw_user_meta_data ->> 'display_name'
from auth.users u
where u.id = p.id
  and p.display_name is null
  and u.raw_user_meta_data ->> 'display_name' is not null;

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
  -- One row per arena persona: latest non-bogus rank, resolved to a single
  -- account (an arena_id can be claimed by more than one login), private
  -- profiles excluded. "Spark" is the placeholder a failed rank read wrote.
  select s.arena_id, s.display_name, s.username, s.avatar_url,
         s.constructed, s.limited, s.updated_at
  from (
    select distinct on (r.arena_id)
      r.arena_id, a.display_name,
      coalesce(p.display_name, p.username) as username,
      p.avatar_url,
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

create or replace function public.get_player_profile(
  p_arena_id text default null,
  p_username text default null
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with target as (
    -- An arena_id can be claimed by several logins; resolve to the one who
    -- used it most recently. If that person is private the whole lookup
    -- resolves to nothing — it does not fall through to older claimants.
    select user_id from (
      select a.user_id, a.last_seen_at
      from arena_accounts a
      where p_arena_id is not null and a.arena_id = p_arena_id
      order by a.last_seen_at desc
      limit 1
    ) latest_claimant
    union all
    select p.id
    from profiles p
    where p_username is not null
      and (lower(p.username) = lower(p_username)
        or lower(p.display_name) = lower(p_username))
    limit 1
  ),
  -- The single account this profile exposes: the pinned one when set and
  -- still owned, otherwise the most recently played.
  visible as (
    select a.user_id, a.arena_id
    from arena_accounts a
    join target t on a.user_id = t.user_id
    left join profiles pp on pp.id = t.user_id
    order by (a.arena_id = pp.visible_arena_id) desc nulls last,
             a.last_seen_at desc
    limit 1
  )
  select jsonb_build_object(
    'username', coalesce(p.display_name, p.username),
    'avatar_url', p.avatar_url,
    'supporter_tier', coalesce(p.supporter_tier, 0),
    'background', p.background,
    'member_since', p.created_at,
    'account', (
      select jsonb_build_object(
        -- The in-game name is written sparsely and the same arena_id can be
        -- claimed by several logins, so take the freshest name any claim has.
        'display_name', coalesce(a.display_name, (
          select a3.display_name
          from arena_accounts a3
          where a3.arena_id = a.arena_id
            and a3.display_name is not null
          order by a3.last_seen_at desc
          limit 1
        )),
        'constructed', r.constructed,
        'limited', r.limited,
        'ranks_updated_at', r.updated_at
      )
      from arena_accounts a
      left join arena_ranks r
        on r.user_id = a.user_id and r.arena_id = a.arena_id
      join visible v on a.user_id = v.user_id and a.arena_id = v.arena_id
    ),
    'format_counts', (
      select coalesce(jsonb_object_agg(x.event_id, x.n), '{}'::jsonb)
      from (
        select m.event_id, count(*) as n
        from matches m
        join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
        group by m.event_id
      ) x
    )
  )
  from target t
  left join profiles p on p.id = t.user_id
  where coalesce(p.is_private, false) = false;
$$;

create or replace function public.get_player_matches(
  p_arena_id text default null,
  p_username text default null,
  p_limit integer default 5,
  p_offset integer default 0
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with target as (
    select user_id from (
      select a.user_id, a.last_seen_at
      from arena_accounts a
      where p_arena_id is not null and a.arena_id = p_arena_id
      order by a.last_seen_at desc
      limit 1
    ) latest_claimant
    union all
    select p.id
    from profiles p
    where p_username is not null
      and (lower(p.username) = lower(p_username)
        or lower(p.display_name) = lower(p_username))
    limit 1
  ),
  visible as (
    select a.user_id, a.arena_id
    from arena_accounts a
    join target t on a.user_id = t.user_id
    left join profiles pp on pp.id = t.user_id
    order by (a.arena_id = pp.visible_arena_id) desc nulls last,
             a.last_seen_at desc
    limit 1
  ),
  -- Entitlements are the server-written pledge record; Standard tier (2) and
  -- up may page through the whole history, everyone else gets the last 5.
  viewer as (
    select exists (
      select 1
      from entitlements e
      where e.user_id = auth.uid()
        and e.active
        and e.tier >= 2
        and (e.expires_at is null or e.expires_at > now())
    ) as full_access
  ),
  bounds as (
    select
      case when w.full_access
        then least(greatest(coalesce(p_limit, 5), 1), 50)
        else least(greatest(coalesce(p_limit, 5), 1), 5)
      end as lim,
      case when w.full_access then greatest(coalesce(p_offset, 0), 0) else 0 end as off,
      w.full_access
    from viewer w
  )
  select jsonb_build_object(
    'matches', coalesce((
      select jsonb_agg(row_json)
      from (
        select jsonb_build_object(
          'match_id', m.match_id,
          'event_id', m.event_id,
          'played_at', m.played_at,
          'deck_name', m.internal_match -> 'playerDeck' ->> 'name',
          'deck_tile_id', m.internal_match -> 'playerDeck' -> 'deckTileId',
          -- Draft decks carry the stock tile; ship their card ids so the
          -- client can borrow a mythic/rare for art, like the History tab.
          'fallback_ids', case
            when coalesce((m.internal_match -> 'playerDeck' ->> 'deckTileId')::numeric, 0)
              in (0, 67003)
            then (
              select jsonb_agg(distinct c -> 'id')
              from jsonb_array_elements(m.internal_match -> 'playerDeck' -> 'mainDeck') c
            )
            else null
          end,
          'opp_name', m.internal_match -> 'opponent' ->> 'name',
          'player_rank', jsonb_build_object(
            'rank', m.internal_match -> 'player' ->> 'rank',
            'tier', m.internal_match -> 'player' -> 'tier',
            'step', m.internal_match -> 'player' -> 'step',
            'percentile', m.internal_match -> 'player' -> 'percentile',
            'leaderboardPlace', m.internal_match -> 'player' -> 'leaderboardPlace'
          ),
          'opp_rank', jsonb_build_object(
            'rank', m.internal_match -> 'opponent' ->> 'rank',
            'tier', m.internal_match -> 'opponent' -> 'tier',
            'step', m.internal_match -> 'opponent' -> 'step',
            'percentile', m.internal_match -> 'opponent' -> 'percentile',
            'leaderboardPlace', m.internal_match -> 'opponent' -> 'leaderboardPlace'
          ),
          'player_deck_colors', m.player_deck_colors,
          'opp_deck_colors', m.opp_deck_colors,
          'player_wins', m.player_wins,
          'player_losses', m.player_losses,
          'duration', m.duration
        ) as row_json
        from matches m
        join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
        order by m.played_at desc
        limit (select lim from bounds)
        offset (select off from bounds)
      ) page
    ), '[]'::jsonb),
    'total', (
      select count(*)
      from matches m
      join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
    ),
    'full_access', (select full_access from bounds)
  )
  from target t
  left join profiles p on p.id = t.user_id
  where coalesce(p.is_private, false) = false;
$$;

create or replace function public.get_public_match(
  p_match_id text,
  p_arena_id text default null,
  p_username text default null
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with target as (
    select user_id from (
      select a.user_id, a.last_seen_at
      from arena_accounts a
      where p_arena_id is not null and a.arena_id = p_arena_id
      order by a.last_seen_at desc
      limit 1
    ) latest_claimant
    union all
    select p.id
    from profiles p
    where p_username is not null
      and (lower(p.username) = lower(p_username)
        or lower(p.display_name) = lower(p_username))
    limit 1
  ),
  visible as (
    select a.user_id, a.arena_id
    from arena_accounts a
    join target t on a.user_id = t.user_id
    left join profiles pp on pp.id = t.user_id
    order by (a.arena_id = pp.visible_arena_id) desc nulls last,
             a.last_seen_at desc
    limit 1
  )
  select jsonb_build_object(
    'match_id', m.match_id,
    'event_id', m.event_id,
    'played_at', m.played_at,
    'duration', m.duration,
    'best_of', m.internal_match -> 'bestOf',
    'player_wins', m.player_wins,
    'player_losses', m.player_losses,
    'player_deck', m.internal_match -> 'playerDeck',
    'action_log', m.internal_match -> 'actionLog',
    'opp_deck_colors', m.opp_deck_colors,
    'opp_name', m.internal_match -> 'opponent' ->> 'name',
    'player_rank', jsonb_build_object(
      'rank', m.internal_match -> 'player' ->> 'rank',
      'tier', m.internal_match -> 'player' -> 'tier',
      'step', m.internal_match -> 'player' -> 'step',
      'percentile', m.internal_match -> 'player' -> 'percentile',
      'leaderboardPlace', m.internal_match -> 'player' -> 'leaderboardPlace'
    ),
    'opp_rank', jsonb_build_object(
      'rank', m.internal_match -> 'opponent' ->> 'rank',
      'tier', m.internal_match -> 'opponent' -> 'tier',
      'step', m.internal_match -> 'opponent' -> 'step',
      'percentile', m.internal_match -> 'opponent' -> 'percentile',
      'leaderboardPlace', m.internal_match -> 'opponent' -> 'leaderboardPlace'
    )
  )
  from matches m
  join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
  join target t on true
  left join profiles p on p.id = t.user_id
  where m.match_id = p_match_id
    and coalesce(p.is_private, false) = false;
$$;
