-- Patreon supporter entitlements.
--
-- Three pieces, deliberately separated by who is allowed to see what:
--
--   patron_pledges  the raw patron list pulled from Patreon. Holds real email
--                   addresses, so it has ZERO policies -- no client key reads it
--                   ever. Same stance as auth_recovery_pending.
--   entitlements    the resolved per-user answer. A user may read their own row
--                   and nothing else; only the service role writes.
--   profiles.supporter_tier
--                   a PUBLIC mirror of the tier, so other people's badges can be
--                   rendered in public feeds. Guarded by a trigger, because
--                   profiles has an owner-update policy and would otherwise let
--                   anyone award themselves a pledge.
--
-- Tiers follow the naming already used on the website (MTG formats, by pledge
-- amount): 1 Casual, 2 Standard (>= $5), 3 Modern (>= $10), 4 Legacy (>= $20).

-- ---------------------------------------------------------------------------
-- The raw patron list
-- ---------------------------------------------------------------------------

create table if not exists public.patron_pledges (
  -- Patreon's member id. Durable across email and pledge changes, which is why
  -- it and not the address is the key.
  patreon_user_id    text primary key,
  email_normalized   text,
  full_name          text,
  thumb_url          text,
  tier               int  not null default 0,
  cents              int  not null default 0,
  status             text,
  last_charge_status text,
  valid_until        timestamptz,
  synced_at          timestamptz not null default now()
);

create index if not exists patron_pledges_email_idx
  on public.patron_pledges (email_normalized);

alter table public.patron_pledges enable row level security;
-- Intentionally no policies: service role only.
--
-- And no table grant to anon/authenticated either. Supabase's default
-- privileges hand every new public table to both roles and rely on RLS alone;
-- for a table holding the patron list and their email addresses, the missing
-- grant is a second lock behind the missing policy.
grant select, insert, update, delete on public.patron_pledges to service_role;

-- ---------------------------------------------------------------------------
-- The resolved answer the app reads
-- ---------------------------------------------------------------------------

create table if not exists public.entitlements (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  tier            int  not null default 0,
  active          boolean not null default false,
  source          text not null default 'patreon',
  -- One Patreon member can back exactly one account. A second account trying to
  -- claim the same pledge hits this and is rejected rather than duplicating.
  patreon_user_id text unique references public.patron_pledges(patreon_user_id)
                  on delete set null,
  -- email | admin. An admin link is never overwritten by the resolver.
  linked_via      text,
  linked_at       timestamptz,
  -- Pledge end plus grace. A missed sync must not flap everyone to free and
  -- back, so entitlement fails open for a few days rather than closed.
  expires_at      timestamptz,
  updated_at      timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own
  on public.entitlements for select to authenticated
  -- Wrapped in a select per the initplan optimisation migration.
  using (user_id = (select auth.uid()));

grant select on public.entitlements to authenticated;
-- Reads only for the owner (policy above); all writes go through the sync.
grant select, insert, update, delete on public.entitlements to service_role;

-- Single definition of "what tier is this user, right now", so nothing
-- downstream re-implements the expiry rule.
create or replace function public.entitlement_tier(p_user uuid default auth.uid())
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(tier), 0)
    from public.entitlements
   where user_id = p_user
     and active
     and (expires_at is null or expires_at > now());
$$;

grant execute on function public.entitlement_tier(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Public badge mirror on profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists supporter_tier int not null default 0;

-- profiles is owner-updatable ("profiles owner update"), so without this a user
-- could simply set their own supporter_tier. The column is writable only inside
-- the mirror trigger below, which announces itself with a transaction-local
-- setting the client has no way to set.
create or replace function public.protect_supporter_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.supporter_sync', true), '') <> 'on' then
    new.supporter_tier := coalesce(old.supporter_tier, 0);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_supporter_tier on public.profiles;
create trigger profiles_protect_supporter_tier
  before insert or update on public.profiles
  for each row execute function public.protect_supporter_tier();

-- Keep the public mirror in step with the private answer.
create or replace function public.sync_supporter_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  effective int;
begin
  effective := case
    when new.active and (new.expires_at is null or new.expires_at > now())
    then new.tier else 0 end;

  perform set_config('app.supporter_sync', 'on', true);
  update public.profiles set supporter_tier = effective where id = new.user_id;
  perform set_config('app.supporter_sync', 'off', true);

  return new;
end;
$$;

drop trigger if exists entitlements_sync_supporter_tier on public.entitlements;
create trigger entitlements_sync_supporter_tier
  after insert or update on public.entitlements
  for each row execute function public.sync_supporter_tier();
