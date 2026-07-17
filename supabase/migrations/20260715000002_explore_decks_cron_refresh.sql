-- Refresh the Explore aggregate hourly so it stays current as matches arrive.
create extension if not exists pg_cron;

-- Named schedule upserts, so re-running is safe.
select cron.schedule(
  'refresh-explore-decks',
  '17 * * * *',
  $$ select public.refresh_explore_decks(); $$
);
