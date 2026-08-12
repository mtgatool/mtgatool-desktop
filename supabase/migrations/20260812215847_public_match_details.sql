-- Profile match rows get what the History-tab rows show (deck tile, colors,
-- opponent name, both players' ranks) plus the match id so a row can open a
-- public match page. get_public_match serves that page: the played deck,
-- result, event and ranks — never arena ids, action logs or game telemetry.

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
    where p_username is not null and lower(p.username) = lower(p_username)
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

-- The public view of one match: enough to show the played deck, the
-- opponent and the result. Scoped to the profile's visible account and gated
-- on the same privacy flag; match ids only circulate via get_player_matches,
-- which is what limits who can discover them.
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
    where p_username is not null and lower(p.username) = lower(p_username)
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

grant execute on function public.get_public_match(text, text, text)
  to anon, authenticated;
