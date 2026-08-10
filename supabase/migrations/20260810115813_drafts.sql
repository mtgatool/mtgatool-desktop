-- Cloud storage for drafts, mirroring the matches pattern: one row per draft
-- keyed (user_id, draft_id), the full record as jsonb beside a few queryable
-- columns. draft_id is Arena's CourseId, which is what the local records key
-- on too (draft-<id> in the KV), so the two sides reconcile by id alone.
--
-- No tombstone table yet: the app has no way to delete a draft. If one is
-- added, copy deleted_matches — the resurrection loop it prevents applies
-- identically here.
create table if not exists public.drafts (
  user_id uuid not null default auth.uid(),
  draft_id text not null,
  arena_id text not null,
  event_id text,
  draft_set text,
  played_at timestamptz,
  deck_id text,
  internal_draft jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, draft_id),
  constraint drafts_user_id_arena_id_fkey
    foreign key (user_id, arena_id)
    references public.arena_accounts (user_id, arena_id)
    on delete cascade
);

alter table public.drafts enable row level security;

-- Same shape as matches_owner: your own rows, all operations.
drop policy if exists drafts_owner on public.drafts;
create policy drafts_owner
  on public.drafts
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
