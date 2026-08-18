-- Hourly Patreon sync.
--
-- pg_cron fires a plpgsql shim, which asks pg_net to POST the patreon-sync edge
-- function. The work happens in TypeScript because the Patreon API is paged
-- JSON, which is miserable in plpgsql.
--
-- Neither the function URL nor the service-role key is written here: both are
-- read from Vault at call time, so this migration carries no secrets and is
-- safe in git. Set them once per project:
--
--   select vault.create_secret(
--     'https://<ref>.supabase.co/functions/v1/patreon-sync', 'patreon_sync_url');
--   select vault.create_secret('<service-role key>', 'patreon_sync_key');
--
-- and set the function's own Patreon token out of band:
--   supabase secrets set PATREON_ACCESS_TOKEN=...
--
-- Scheduled at :43 to stay clear of the Explore refresh at :17 — they both hit
-- the same small instance and there is no reason to overlap them.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_patreon_sync()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  fn_url  text;
  svc_key text;
begin
  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'patreon_sync_url';
  select decrypted_secret into svc_key
    from vault.decrypted_secrets where name = 'patreon_sync_key';

  -- Missing secrets is the normal state of a fresh environment, so say so and
  -- stop rather than failing the cron job every hour.
  if fn_url is null or svc_key is null then
    raise notice 'patreon sync skipped: set patreon_sync_url and patreon_sync_key in vault';
    return;
  end if;

  -- pg_net is fire-and-forget; the response lands in net._http_response. The
  -- edge function is the thing that reports what it did.
  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || svc_key
               ),
    body    := '{}'::jsonb
  );
end;
$$;

revoke all on function public.trigger_patreon_sync() from public;

-- Named schedule upserts, so re-running the migration is safe.
select cron.schedule(
  'patreon-sync',
  '43 * * * *',
  $$ select public.trigger_patreon_sync(); $$
);
