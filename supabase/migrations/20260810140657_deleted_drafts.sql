-- Cloud tombstones for deleted drafts — the deleted_matches pattern, verbatim.
-- Without this a draft deleted on one device is re-pushed by any other device
-- that still holds it locally (syncDrafts) and restored on fresh logins
-- (hydrateFromCloud). The tombstone is the shared fact both paths consult.
create table if not exists public.deleted_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  draft_id text not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, draft_id)
);

alter table public.deleted_drafts enable row level security;

-- Same shape as deleted_matches_owner: your own rows, all operations.
drop policy if exists deleted_drafts_owner on public.deleted_drafts;
create policy deleted_drafts_owner
  on public.deleted_drafts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
