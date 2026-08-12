-- The shared-deck page links back to the owner's profile and shows the
-- deck's recent matches, so the payload now carries the pretty display name
-- and the Arena deck id (both withheld for private-mode owners, whose
-- profile and matches resolve to nothing anyway).

create or replace function public.get_shared_deck(p_share_id text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'deck', sd.deck,
    'updated_at', sd.updated_at,
    'deck_id', case
      when coalesce(p.is_private, false) then null
      else sd.deck_id
    end,
    'owner', case
      when coalesce(p.is_private, false) then jsonb_build_object(
        'username', null,
        'avatar_url', null,
        'supporter_tier', coalesce(p.supporter_tier, 0)
      )
      else jsonb_build_object(
        'username', coalesce(p.display_name, p.username),
        'avatar_url', p.avatar_url,
        'supporter_tier', coalesce(p.supporter_tier, 0)
      )
    end,
    'winrate', case
      when sd.include_winrate then (
        select jsonb_build_object(
          'wins', count(*) filter (
            where coalesce(m.player_wins, 0) > coalesce(m.player_losses, 0)
          ),
          'losses', count(*) filter (
            where coalesce(m.player_wins, 0) <= coalesce(m.player_losses, 0)
          )
        )
        from matches m
        where m.user_id = sd.user_id and m.player_deck_id = sd.deck_id
      )
      else null
    end
  )
  from shared_decks sd
  left join profiles p on p.id = sd.user_id
  where sd.share_id = p_share_id;
$$;
