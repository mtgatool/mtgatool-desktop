-- Accounts are username/password only; the email is a synthetic
-- user-<name>@mtgatool.com address that never receives mail, so there's no
-- confirmation link. Auto-confirm these on insert so signup -> login works
-- without depending on the dashboard "Confirm email" toggle. Function lives
-- in public (the auth schema is not writable), trigger runs on auth.users.
create or replace function public.auto_confirm_synthetic_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email like 'user-%@mtgatool.com' and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

revoke execute on function public.auto_confirm_synthetic_email() from public;
revoke execute on function public.auto_confirm_synthetic_email() from anon;
revoke execute on function public.auto_confirm_synthetic_email() from authenticated;

drop trigger if exists auto_confirm_synthetic_email on auth.users;
create trigger auto_confirm_synthetic_email
  before insert on auth.users
  for each row execute function public.auto_confirm_synthetic_email();
