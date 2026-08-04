-- Explore: cross-user, deck-level aggregates grouped by deck hash per event.
-- Exposes ONLY aggregates (no user_id / player names / raw matches). A deck
-- must have >= 10 matches from >= 2 distinct pilots to appear, so no single
-- person's data is ever surfaced.
create materialized view if not exists public.explore_decks as
select
  m.event_id,
  m.player_deck_hash                                               as deck_hash,
  count(*)::int                                                    as games,
  count(*) filter (
    where coalesce(m.player_wins, 0) > coalesce(m.player_losses, 0)
  )::int                                                           as wins,
  count(*) filter (
    where coalesce(m.player_wins, 0) <= coalesce(m.player_losses, 0)
  )::int                                                           as losses,
  count(distinct m.user_id)::int                                   as pilots,
  round(
    100.0 * count(*) filter (
      where coalesce(m.player_wins, 0) > coalesce(m.player_losses, 0)
    ) / nullif(count(*), 0)
  , 1)::float8                                                     as winrate,
  (array_agg(m.internal_match -> 'playerDeck'
     order by m.played_at desc nulls last))[1]                     as deck,
  (array_agg(m.player_deck_colors
     order by m.played_at desc nulls last)
     filter (where m.player_deck_colors is not null))[1]           as colors,
  max(m.played_at)                                                 as last_played
from public.matches m
where m.event_id is not null
  and m.player_deck_hash is not null
  and m.player_deck_hash <> ''
group by m.event_id, m.player_deck_hash
having count(*) >= 10 and count(distinct m.user_id) >= 2;

-- Unique index enables CONCURRENT (non-blocking) refresh; event index for reads.
create unique index if not exists explore_decks_pk
  on public.explore_decks (event_id, deck_hash);
create index if not exists explore_decks_event_idx
  on public.explore_decks (event_id);

-- Aggregates only -> safe to read publicly via PostgREST.
grant select on public.explore_decks to anon, authenticated;

-- Refresh helper (SECURITY DEFINER: sees all rows, called by cron or on demand).
create or replace function public.refresh_explore_decks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.explore_decks;
exception when others then
  refresh materialized view public.explore_decks;
end;
$$;
