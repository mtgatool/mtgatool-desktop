-- Recovery email addresses.
--
-- Accounts are keyed by a synthetic, unreachable address (see cloudAuth.ts:
-- "user-<name>@mtgatool.com"), so there is no way to mail a user who forgot
-- their password. This table holds a real address, proven readable by its owner,
-- that the reset flow can send a code to.
--
-- Deliberately NOT a column on `profiles`: profiles feeds public lookups
-- (get_public_profiles, get_latest_ranks), and an address must never be able to
-- ride along in one of those selects. Separate table, owner-only reads.
--
-- No unique constraint on `email`: one person may legitimately hold several
-- accounts, and a uniqueness error would double as an "is this address
-- registered" oracle.
create table if not exists public.auth_recovery (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  -- When the owner proved they can read mail at this address. A row only exists
  -- because the recovery-email function verified a code, so this is never null
  -- in practice; the reset flow still checks it rather than assuming.
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auth_recovery enable row level security;

-- Read and delete your own row; nothing else. Crucially there is NO insert or
-- update policy: if clients could write here, a user could store an arbitrary
-- address with verified_at set and the verification would mean nothing. Rows
-- are written only by the recovery-email edge function, which runs with the
-- service role (and so bypasses RLS) after checking a mailed code.
drop policy if exists auth_recovery_own_row on public.auth_recovery;
drop policy if exists auth_recovery_select_own on public.auth_recovery;
create policy auth_recovery_select_own
  on public.auth_recovery
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists auth_recovery_delete_own on public.auth_recovery;
create policy auth_recovery_delete_own
  on public.auth_recovery
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- In-flight verifications: the address the user asked for, plus a hash of the
-- code mailed to it. RLS is enabled with NO policies at all, so this is
-- unreachable by any client key — only the service role in the edge function
-- touches it. That is what stops a user from reading their own pending code
-- (and thus verifying an address they cannot actually read).
create table if not exists public.auth_recovery_pending (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  -- sha256(code || ':' || user_id), never the code itself.
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.auth_recovery_pending enable row level security;
