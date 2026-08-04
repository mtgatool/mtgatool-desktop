-- Support for the forgot-password flow.
--
-- The client knows the account's synthetic login address (it derives
-- "user-<name>@mtgatool.com" from the username, exactly as sign-in does), but
-- must never learn the real recovery address behind it. So the mapping is
-- resolved server-side only: this function is the sole way to go from a login
-- address to a recovery target, and only the service role may call it.

-- Throttles reset mails per account. Only the edge function writes it.
alter table public.auth_recovery
  add column if not exists last_reset_at timestamptz;

create or replace function public.recovery_target_for_login(p_login_email text)
returns table (
  user_id uuid,
  email text,
  verified_at timestamptz,
  last_reset_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select r.user_id, r.email, r.verified_at, r.last_reset_at
  from auth.users u
  join public.auth_recovery r on r.user_id = u.id
  where lower(u.email) = lower(p_login_email)
$$;

-- Locked to the service role. Reachable by anon/authenticated it would be an
-- "which accounts have a recovery address, and what is it" oracle.
revoke all on function public.recovery_target_for_login(text) from public;
revoke all on function public.recovery_target_for_login(text) from anon;
revoke all on function public.recovery_target_for_login(text) from authenticated;
grant execute on function public.recovery_target_for_login(text) to service_role;

create or replace function public.mark_recovery_reset_sent(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.auth_recovery set last_reset_at = now() where user_id = p_user_id
$$;

revoke all on function public.mark_recovery_reset_sent(uuid) from public;
revoke all on function public.mark_recovery_reset_sent(uuid) from anon;
revoke all on function public.mark_recovery_reset_sent(uuid) from authenticated;
grant execute on function public.mark_recovery_reset_sent(uuid) to service_role;
