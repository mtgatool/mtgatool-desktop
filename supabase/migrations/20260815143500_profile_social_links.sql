-- Social links on a public profile: Twitch, YouTube and Instagram.
--
-- One jsonb column rather than three text ones, matching how `background`
-- already rides on this table: a fourth platform then costs no migration.
--
-- The client validates and REBUILDS every link from the handle it captured
-- (src/utils/socialLinks.ts), so what it sends is always canonical. The
-- constraint below says the same thing in the place that cannot be bypassed:
-- these values become hrefs on a page other people load, and the table is
-- reachable by any authenticated client writing its own row.
alter table public.profiles
  add column if not exists socials jsonb;

alter table public.profiles
  drop constraint if exists profiles_socials_valid;

alter table public.profiles
  add constraint profiles_socials_valid check (
    socials is null
    or (
      jsonb_typeof(socials) = 'object'
      -- No key we did not put there. Subqueries are not allowed in a check,
      -- so this deletes the known keys and asserts nothing is left over.
      and (socials - 'twitch' - 'youtube' - 'instagram') = '{}'::jsonb
      and (
        not socials ? 'twitch'
        or socials ->> 'twitch' ~ '^https://www\.twitch\.tv/[A-Za-z0-9_]{3,25}$'
      )
      and (
        not socials ? 'youtube'
        or socials ->> 'youtube' ~ '^https://www\.youtube\.com/(@[A-Za-z0-9._-]{3,30}|channel/UC[A-Za-z0-9_-]{22}|c/[A-Za-z0-9._-]{1,80}|user/[A-Za-z0-9._-]{1,80})$'
      )
      and (
        not socials ? 'instagram'
        or socials ->> 'instagram' ~ '^https://www\.instagram\.com/[A-Za-z0-9._]{1,30}$'
      )
    )
  );

-- Publish them on the profile payload. Unchanged apart from the added key;
-- a private profile still resolves to nothing, links and all.
create or replace function public.get_player_profile(
  p_arena_id text default null,
  p_username text default null
)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
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
  -- Which account represents this player: the pinned one, else their best
  -- ranked — the leaderboard picks the same way, so a row and the profile it
  -- links to never disagree. Most recently played breaks the last tie.
  visible as (
    select a.user_id, a.arena_id, a.last_seen_at
    from arena_accounts a
    join target t on a.user_id = t.user_id
    left join profiles pp on pp.id = t.user_id
    left join arena_ranks vr
      on vr.user_id = a.user_id and vr.arena_id = a.arena_id
    order by (a.arena_id = pp.visible_arena_id) desc nulls last,
             greatest(rank_score(vr.constructed), rank_score(vr.limited))
               desc nulls last,
             a.last_seen_at desc
    limit 1
  )
  select jsonb_build_object(
    'username', coalesce(p.display_name, p.username),
    'avatar_url', p.avatar_url,
    'supporter_tier', coalesce(p.supporter_tier, 0),
    'background', p.background,
    'socials', p.socials,
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
$function$;
