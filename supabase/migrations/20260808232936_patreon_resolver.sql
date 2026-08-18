-- Resolve the patron list into per-user entitlements.
--
-- Accounts are keyed by a synthetic address (cloudAuth.ts builds
-- "user-<name>@mtgatool.com"), so a Patreon email can never be matched against
-- auth.users. The only real, proven address in the system is
-- auth_recovery.email, written server-side after the owner read a mailed code —
-- so that is the join key, and verifying your Patreon address in Settings ->
-- My Account is the self-service way to link.
--
-- Called by the patreon-sync edge function right after it refreshes
-- patron_pledges. Service role only: it reads auth_recovery, which no client
-- key can see.

create or replace function public.resolve_patron_entitlements(
  p_grace interval default interval '3 days'
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  linked int := 0;
begin
  -- 1. Refresh everyone already linked.
  --
  -- Identity is never re-resolved for these: a patron who changes their Patreon
  -- email, or removes it, must not be silently unlinked.
  update public.entitlements e
     set tier       = p.tier,
         active     = (p.status = 'active_patron' and p.tier > 0),
         expires_at = case
                        when p.status = 'active_patron' then null
                        else coalesce(p.valid_until, now()) + p_grace
                      end,
         updated_at = now()
    from public.patron_pledges p
   where e.patreon_user_id = p.patreon_user_id;

  -- 2. A pledge that vanished from Patreon entirely (deleted member) still has
  --    an entitlement row pointing at nothing once the FK nulls out. Close it.
  update public.entitlements
     set active     = false,
         expires_at = least(coalesce(expires_at, now() + p_grace), now() + p_grace),
         updated_at = now()
   where patreon_user_id is null
     and source = 'patreon'
     and active;

  -- 3. Link new patrons by verified recovery email.
  --
  -- Only when EXACTLY one account has verified that address: auth_recovery
  -- deliberately has no unique constraint on email (one person may hold several
  -- accounts), so an ambiguous match is a real case. Guessing would hand a
  -- pledge to the wrong account, so those are left for an admin link instead.
  with candidate as (
    select p.patreon_user_id,
           p.tier,
           p.status,
           p.valid_until,
           -- Postgres has no min(uuid); take the first of the aggregate. Only
           -- ever read when exactly one row matched, so which one is moot.
           (array_agg(r.user_id))[1] as user_id,
           count(*)                  as matches
      from public.patron_pledges p
      join public.auth_recovery r
        on lower(btrim(r.email)) = p.email_normalized
     where p.email_normalized is not null
       and r.verified_at is not null
       and p.tier > 0
       -- Only a paying patron opens a new link. Status and amount can disagree
       -- (a former patron may still carry their last entitled amount), and
       -- linking on the amount alone would mint rows for ex-patrons and spend
       -- the one-account-per-patron link on somebody who is not paying. A
       -- declined patron who recovers links on the next run; one already linked
       -- is refreshed by step 1 regardless of status.
       and p.status = 'active_patron'
       -- Not already linked to some account.
       and not exists (
             select 1 from public.entitlements e
              where e.patreon_user_id = p.patreon_user_id
           )
     group by p.patreon_user_id, p.tier, p.status, p.valid_until
  ),
  unambiguous as (
    select * from candidate where matches = 1
  ),
  inserted as (
    insert into public.entitlements as e
      (user_id, tier, active, source, patreon_user_id, linked_via, linked_at,
       expires_at, updated_at)
    select u.user_id,
           u.tier,
           (u.status = 'active_patron'),
           'patreon',
           u.patreon_user_id,
           'email',
           now(),
           case when u.status = 'active_patron' then null
                else coalesce(u.valid_until, now()) + p_grace end,
           now()
      from unambiguous u
    on conflict (user_id) do update
      -- The account already had an entitlement (a lapsed pledge, or a manual
      -- grant). Adopt the pledge unless an admin set it by hand.
      set tier            = excluded.tier,
          active          = excluded.active,
          patreon_user_id = excluded.patreon_user_id,
          linked_via      = excluded.linked_via,
          linked_at       = excluded.linked_at,
          expires_at      = excluded.expires_at,
          updated_at      = now()
      where e.linked_via is distinct from 'admin'
    returning 1
  )
  select count(*) into linked from inserted;

  return linked;
end;
$$;

-- Service role only; never exposed to anon/authenticated. The revoke strips
-- PUBLIC's implicit execute, which is what keeps client keys out -- and takes
-- service_role's with it, so it is granted back explicitly.
revoke all on function public.resolve_patron_entitlements(interval) from public;
grant execute on function public.resolve_patron_entitlements(interval) to service_role;
