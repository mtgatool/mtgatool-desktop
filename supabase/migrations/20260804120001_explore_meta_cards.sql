-- Explore: opponent-side meta aggregates.
--
-- Every match carries the opponent's observed cards (`internal_match ->
-- 'opponent' -> 'cardsUsed'), collected from ~1030 distinct opponent accounts.
-- That makes it a sample of the actual Arena ladder rather than a sample of who
-- happens to run the tracker -- unlike the player-side aggregates, where the top
-- uploader alone accounts for a quarter of all matches.
--
-- Presence only. `oppDeck.mainDeck` carries a `quantity` field, but it is an
-- inference heuristic, not observed data (the values are overwhelmingly even --
-- 2, 4, 6, 8 -- because copies are estimated, not counted). Anything derived
-- from it would be fiction, so this view counts *whether* a card was seen, never
-- how many copies.
--
-- `winrate` is the OPPONENT's winrate in matches where they showed the card,
-- i.e. how well the decks playing it actually did.

-- Re-runnable: drop before create, cards first since it reads events. Without
-- this, applying the file twice fails on the existing view.
drop materialized view if exists public.explore_meta_cards;
drop materialized view if exists public.explore_meta_events;

-- Per-event totals: the denominator for presence, and the Explore event list.
create materialized view public.explore_meta_events as
select
  m.event_id,
  count(*)::int                                                    as matches,
  count(*) filter (
    where jsonb_array_length(m.internal_match -> 'opponent' -> 'cardsUsed') > 0
  )::int                                                           as observed_matches,
  count(distinct m.internal_match -> 'opponent' ->> 'userid')::int  as opponents,
  max(m.played_at)                                                 as last_played
from public.matches m
where m.event_id is not null
group by m.event_id
having count(*) filter (
  where jsonb_array_length(m.internal_match -> 'opponent' -> 'cardsUsed') > 0
) >= 20;

create unique index explore_meta_events_pk
  on public.explore_meta_events (event_id);

-- Per-card presence and winrate within an event.
create materialized view public.explore_meta_cards as
with observed as (
  select
    m.event_id,
    m.match_id,
    m.played_at,
    coalesce(m.player_wins, 0) > coalesce(m.player_losses, 0) as player_won,
    c.grpid
  from public.matches m
  join public.explore_meta_events e on e.event_id = m.event_id
  cross join lateral (
    -- distinct: a card seen in several games of one match counts once
    select distinct (v)::int as grpid
    from jsonb_array_elements_text(
      m.internal_match -> 'opponent' -> 'cardsUsed'
    ) v
  ) c
)
select
  o.event_id,
  o.grpid,
  count(distinct o.match_id)::int                                  as seen_in,
  e.observed_matches,
  round(
    100.0 * count(distinct o.match_id) / nullif(e.observed_matches, 0)
  , 1)::float8                                                     as presence,
  -- from the perspective of the deck that played the card
  count(*) filter (where not o.player_won)::int                    as wins,
  count(*) filter (where o.player_won)::int                        as losses,
  round(
    100.0 * count(*) filter (where not o.player_won) / nullif(count(*), 0)
  , 1)::float8                                                     as winrate,
  max(o.played_at)                                                 as last_seen
from observed o
join public.explore_meta_events e on e.event_id = o.event_id
group by o.event_id, o.grpid, e.observed_matches
having count(distinct o.match_id) >= 5;

create unique index explore_meta_cards_pk
  on public.explore_meta_cards (event_id, grpid);
create index explore_meta_cards_event_idx
  on public.explore_meta_cards (event_id, seen_in desc);

-- Aggregates only, no user_id / names / match rows -> safe to read publicly.
grant select on public.explore_meta_events to anon, authenticated;
grant select on public.explore_meta_cards  to anon, authenticated;

-- Refresh all Explore aggregates. explore_meta_cards reads explore_meta_events,
-- so the events view must be refreshed first. Each is attempted CONCURRENTLY and
-- falls back on its own -- one failure must not skip the rest.
create or replace function public.refresh_explore_aggregates()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    refresh materialized view concurrently public.explore_meta_events;
  exception when others then
    refresh materialized view public.explore_meta_events;
  end;

  begin
    refresh materialized view concurrently public.explore_meta_cards;
  exception when others then
    refresh materialized view public.explore_meta_cards;
  end;

  begin
    refresh materialized view concurrently public.explore_decks;
  exception when others then
    refresh materialized view public.explore_decks;
  end;
end;
$$;

-- Keep the old entry point working; it now refreshes everything.
create or replace function public.refresh_explore_decks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_explore_aggregates();
end;
$$;
