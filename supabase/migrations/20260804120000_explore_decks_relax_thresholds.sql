-- Explore: relax the deck aggregate thresholds and drop the empty-decklist rows.
--
-- The original view required >= 10 matches from >= 2 distinct pilots. At current
-- volume that matched exactly two groups, and both were junk: matches where
-- `playerDeck.mainDeck` is empty (precons, Jump In, direct games, bot matches)
-- all hash to sha1("") = da39a3ee5e6b4b0d3255bfef95601890afd80709, so Explore
-- rendered two empty deck tiles and nothing else.
--
-- The 2-pilot rule cannot be met at this scale: players don't share decklists,
-- they iterate on their own. Of the deck pairs sharing >= 60% of their cards in
-- constructed events, only 5 were across different users. So the rule is dropped
-- and the bar is 5 matches.
--
-- NOTE: with pilots >= 1, a row can represent a single player's decklist. No
-- user_id, username or match row is exposed -- only the list and its aggregate
-- record -- but this is a deliberate relaxation of the original "never surface
-- one person's data" stance. `pilots` stays in the output so the UI can show it.

drop materialized view if exists public.explore_decks;

create materialized view public.explore_decks as
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
  -- Drop matches whose decklist was never captured; these all collapse onto the
  -- sha1 of the empty string and would otherwise dominate the view.
  and jsonb_array_length(m.internal_match -> 'playerDeck' -> 'mainDeck') > 0
group by m.event_id, m.player_deck_hash
having count(*) >= 5;

-- Unique index enables CONCURRENT (non-blocking) refresh; event index for reads.
create unique index explore_decks_pk
  on public.explore_decks (event_id, deck_hash);
create index explore_decks_event_idx
  on public.explore_decks (event_id);

-- Aggregates only -> safe to read publicly via PostgREST.
grant select on public.explore_decks to anon, authenticated;
