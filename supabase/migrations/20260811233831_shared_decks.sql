-- Public deck sharing. A row is one deck the owner chose to publish: the
-- share_id is an unguessable capability token (same model as live_overlays),
-- and the row carries a SNAPSHOT of the decklist — played decks only exist in
-- the client's local stats, so there is nothing server-side to point at.
-- Re-sharing the same deck refreshes the snapshot. The winrate, by contrast,
-- is computed live from the owner's matches at view time.

create table public.shared_decks (
  share_id text primary key,
  user_id uuid not null default auth.uid(),
  -- Arena deck GUID, for the live winrate join against matches.
  deck_id text not null,
  -- Displayable snapshot: name, tile, colors, mainDeck, sideboard,
  -- commanders, companions.
  deck jsonb not null,
  include_winrate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One share per deck; sharing again updates it in place, keeping the link.
  unique (user_id, deck_id)
);

alter table public.shared_decks enable row level security;

-- Owners manage their own shares. There is deliberately NO public select on
-- the table: anonymous viewers go through the RPC below, which exposes only
-- public fields.
create policy "owners manage their shares"
  on public.shared_decks
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Everything the public share page needs, in one call, for anyone holding
-- the token: the deck snapshot, the owner's public identity (hidden when
-- their profile is private — the deck stays visible, the identity does not),
-- their supporter tier for the Patreon badge, and the deck's live record
-- when the owner opted in.
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
    'owner', case
      when coalesce(p.is_private, false) then jsonb_build_object(
        'username', null,
        'avatar_url', null,
        'supporter_tier', coalesce(p.supporter_tier, 0)
      )
      else jsonb_build_object(
        'username', p.username,
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

grant execute on function public.get_shared_deck(text) to anon, authenticated;
