-- Public profiles show a single Arena account, not every id the user has
-- ever played — accounts leak into existence unintentionally (a friend's
-- login, an abandoned alt) and would just sit there empty. By default the
-- most recently played account is shown; the owner can pin a specific one
-- from Settings via profiles.visible_arena_id.
--
-- Also adds get_player_matches: the public recent-match list for that same
-- account. Everyone can read the last 5; callers whose entitlement is
-- Standard tier or higher can page through the full history. Responses never
-- include arena ids or opponent names.

alter table public.profiles
  add column if not exists visible_arena_id text;

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
    where p_username is not null and lower(p.username) = lower(p_username)
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
    'username', p.username,
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
          'event_id', m.event_id,
          'played_at', m.played_at,
          'deck_name', m.internal_match -> 'playerDeck' ->> 'name',
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

grant execute on function public.get_player_matches(text, text, integer, integer)
  to anon, authenticated;
