-- Review fixes for the public profile RPCs:
-- - name lookups resolve exact username matches before anyone's display
--   name (display names are not unique — an imposter could otherwise
--   capture a profile URL), with a deterministic tiebreak;
-- - matches tombstoned in deleted_matches (deleted locally, purge pending)
--   are excluded from every public read;
-- - a null event_id no longer sinks the whole profile call;
-- - match pages order with nulls last and a unique tiebreaker so
--   pagination cannot duplicate or drop rows.

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
    -- Usernames are unique; display names are not. An exact username match
    -- must win over anyone else's display name (impersonation), and among
    -- display-name matches the oldest account wins, deterministically.
    select id from (
      select p.id
      from profiles p
      where p_username is not null
        and (lower(p.username) = lower(p_username)
          or lower(p.display_name) = lower(p_username))
      order by (lower(p.username) = lower(p_username)) desc, p.created_at asc
      limit 1
    ) by_name
    limit 1
  ),
  -- The single account this profile exposes: the pinned one when set and
  -- still owned, otherwise the most recently played.
  visible as (
    select a.user_id, a.arena_id, a.last_seen_at
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
    'last_seen', (select v.last_seen_at from visible v),
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
    -- Match records over a rolling month, split by format side. The rank's
    -- own season totals reset with every season, so they say little right
    -- after a rollover.
    'recent_30d', (
      select jsonb_build_object(
        'constructed', jsonb_build_object(
          'wins',   count(*) filter (where not x.lim and x.won),
          'losses', count(*) filter (where not x.lim and not x.won)
        ),
        'limited', jsonb_build_object(
          'wins',   count(*) filter (where x.lim and x.won),
          'losses', count(*) filter (where x.lim and not x.won)
        )
      )
      from (
        select (m.event_id ~* 'draft|sealed') as lim,
               (m.player_wins > m.player_losses) as won
        from matches m
        join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
        where m.played_at > now() - interval '30 days'
          and not exists (
            select 1 from deleted_matches dm
            where dm.user_id = m.user_id and dm.match_id = m.match_id
          )
      ) x
    ),
    'format_counts', (
      select coalesce(jsonb_object_agg(x.event_id, x.n), '{}'::jsonb)
      from (
        select m.event_id, count(*) as n
        from matches m
        join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
        -- a null event_id would sink jsonb_object_agg (and the whole call)
        where m.event_id is not null
          and not exists (
            select 1 from deleted_matches dm
            where dm.user_id = m.user_id and dm.match_id = m.match_id
          )
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
  p_offset integer default 0,
  p_deck_id text default null
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
    -- Usernames are unique; display names are not. An exact username match
    -- must win over anyone else's display name (impersonation), and among
    -- display-name matches the oldest account wins, deterministically.
    select id from (
      select p.id
      from profiles p
      where p_username is not null
        and (lower(p.username) = lower(p_username)
          or lower(p.display_name) = lower(p_username))
      order by (lower(p.username) = lower(p_username)) desc, p.created_at asc
      limit 1
    ) by_name
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
        where (p_deck_id is null
            or coalesce(m.player_deck_id, m.player_deck_hash) = p_deck_id)
          and not exists (
            select 1 from deleted_matches dm
            where dm.user_id = m.user_id and dm.match_id = m.match_id
          )
        -- nulls last + unique tiebreaker: a null played_at would float to
        -- the top, and unstable order between pages duplicates rows
        order by m.played_at desc nulls last, m.match_id
        limit (select lim from bounds)
        offset (select off from bounds)
      ) page
    ), '[]'::jsonb),
    'total', (
      select count(*)
      from matches m
      join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
      where (p_deck_id is null
          or coalesce(m.player_deck_id, m.player_deck_hash) = p_deck_id)
        and not exists (
          select 1 from deleted_matches dm
          where dm.user_id = m.user_id and dm.match_id = m.match_id
        )
    ),
    'full_access', (select full_access from bounds)
  )
  from target t
  left join profiles p on p.id = t.user_id
  where coalesce(p.is_private, false) = false;
$$;

create or replace function public.get_player_decks(
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
    -- Usernames are unique; display names are not. An exact username match
    -- must win over anyone else's display name (impersonation), and among
    -- display-name matches the oldest account wins, deterministically.
    select id from (
      select p.id
      from profiles p
      where p_username is not null
        and (lower(p.username) = lower(p_username)
          or lower(p.display_name) = lower(p_username))
      order by (lower(p.username) = lower(p_username)) desc, p.created_at asc
      limit 1
    ) by_name
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
  viewer as (
    select exists (
      select 1
      from entitlements e
      where e.user_id = auth.uid()
        and e.active
        and e.tier >= 2
        and (e.expires_at is null or e.expires_at > now())
    ) as full_access
  )
  select jsonb_build_object(
    'full_access', (select full_access from viewer),
    'decks', case when (select full_access from viewer) then coalesce((
      select jsonb_agg(deck_json order by score desc)
      from (
        select g.score,
               jsonb_build_object(
                 'id', g.deck_key,
                 'games', g.games,
                 'wins', g.wins,
                 'last_played', g.last_played,
                 -- The latest version's snapshot; the record above spans
                 -- every version of the deck.
                 'deck', lm.internal_match -> 'playerDeck'
               ) as deck_json
        from (
          -- One row per DECK, not per version: sideboard tweaks change the
          -- hash but keep the Arena deck id, so group on the id (hash only
          -- for old rows that never stored one). Top 5 by the Wilson lower
          -- bound (z=1.96) of the match winrate — the same score the Home
          -- tab ranks top decks with, so a single good night cannot outrank
          -- a deck with forty games behind it.
          select counts.deck_key, counts.games, counts.wins, counts.last_played,
                 ((counts.wins::numeric / counts.games)
                   + 1.9208 / counts.games
                   - 1.96 * sqrt(((counts.wins::numeric / counts.games)
                       * (1 - counts.wins::numeric / counts.games)
                       + 0.9604 / counts.games) / counts.games))
                 / (1 + 3.8416 / counts.games) as score
          from (
            -- nullif: a failed parse can store an EMPTY deck id/hash, which
            -- would aggregate into a nameless, cardless "deck".
            select nullif(coalesce(m.player_deck_id, m.player_deck_hash), '') as deck_key,
                   count(*) as games,
                   count(*) filter (where m.player_wins > m.player_losses) as wins,
                   max(m.played_at) as last_played
            from matches m
            join visible v on m.user_id = v.user_id and m.arena_id = v.arena_id
            where nullif(coalesce(m.player_deck_id, m.player_deck_hash), '') is not null
              and not exists (
                select 1 from deleted_matches dm
                where dm.user_id = m.user_id and dm.match_id = m.match_id
              )
            group by nullif(coalesce(m.player_deck_id, m.player_deck_hash), '')
          ) counts
          order by score desc
          limit 5
        ) g
        join lateral (
          select m2.internal_match
          from matches m2
          join visible v2 on m2.user_id = v2.user_id and m2.arena_id = v2.arena_id
          where coalesce(m2.player_deck_id, m2.player_deck_hash) = g.deck_key
            and not exists (
              select 1 from deleted_matches dm
              where dm.user_id = m2.user_id and dm.match_id = m2.match_id
            )
          order by m2.played_at desc nulls last
          limit 1
        ) lm on true
        -- A snapshot with no cards cannot be shown or opened; skip it.
        where jsonb_array_length(
          coalesce(lm.internal_match -> 'playerDeck' -> 'mainDeck', '[]'::jsonb)
        ) > 0
      ) rows_
    ), '[]'::jsonb) else '[]'::jsonb end
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
    -- Usernames are unique; display names are not. An exact username match
    -- must win over anyone else's display name (impersonation), and among
    -- display-name matches the oldest account wins, deterministically.
    select id from (
      select p.id
      from profiles p
      where p_username is not null
        and (lower(p.username) = lower(p_username)
          or lower(p.display_name) = lower(p_username))
      order by (lower(p.username) = lower(p_username)) desc, p.created_at asc
      limit 1
    ) by_name
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
    and not exists (
      select 1 from deleted_matches dm
      where dm.user_id = m.user_id and dm.match_id = m.match_id
    )
    and coalesce(p.is_private, false) = false;
$$;
