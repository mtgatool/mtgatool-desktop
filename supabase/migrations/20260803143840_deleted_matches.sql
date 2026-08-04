-- Cloud tombstones for deleted matches.
--
-- Deleting a match wrote a tombstone to the LOCAL KV only, which does not
-- survive the trip between devices: delete on device A and the cloud row goes
-- away, but device B still holds the match locally and has no idea it was
-- deleted. Its next syncMatches() sees the cloud "missing" that match and
-- pushes it straight back — after which device A re-hydrates it on its next
-- fresh login. A resurrection loop, with no error anywhere.
--
-- So the tombstone has to be the shared fact, not a local one. syncMatches
-- reads this table to know what NOT to push (and what to drop locally), and
-- hydrateFromCloud reads it to know what not to restore.
create table if not exists public.deleted_matches (
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

alter table public.deleted_matches enable row level security;

-- Same shape as matches_owner: your own rows, all operations. Removing a
-- tombstone (undelete) is legitimate, so delete is allowed too.
drop policy if exists deleted_matches_owner on public.deleted_matches;
create policy deleted_matches_owner
  on public.deleted_matches
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
