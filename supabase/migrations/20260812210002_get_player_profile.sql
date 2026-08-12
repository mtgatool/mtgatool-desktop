-- Public player profile, for the in-app profile screen. Security definer so
-- it can read past per-user RLS, but it exposes only public fields and
-- resolves to nothing for private-mode profiles — same stance as
-- get_latest_ranks / get_public_profiles.
--
-- Looked up by arena persona id (what every rank feed row carries) or by
-- username. The target user's privacy is checked from their profile row,
-- with "no profile row" counting as visible, matching the public feed.

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
  )
  select jsonb_build_object(
    'username', p.username,
    'avatar_url', p.avatar_url,
    'supporter_tier', coalesce(p.supporter_tier, 0),
    'background', p.background,
    'member_since', p.created_at,
    'accounts', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'arena_id', a.arena_id,
            -- An arena_id can be claimed by several logins and the in-game
            -- name is written sparsely, so take the freshest one any of the
            -- claims has recorded.
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
          order by a.last_seen_at desc
        ),
        '[]'::jsonb
      )
      from arena_accounts a
      left join arena_ranks r
        on r.user_id = a.user_id and r.arena_id = a.arena_id
      where a.user_id = t.user_id
    )
  )
  from target t
  left join profiles p on p.id = t.user_id
  where coalesce(p.is_private, false) = false;
$$;

grant execute on function public.get_player_profile(text, text)
  to anon, authenticated;
