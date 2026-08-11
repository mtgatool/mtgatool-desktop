-- Live GetFormats snapshots, uploaded by clients when Arena hands them a
-- formats table this table has not seen before. The hash of the normalized
-- payload is the version: identical snapshots from any number of clients
-- collapse into one row, so nothing is ever rewritten. mtgatool-metadata's
-- auto-update workflow reads the newest row to keep its formats.json current.

create table public.formats_snapshots (
  hash text primary key,
  formats jsonb not null,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.formats_snapshots enable row level security;

-- Any signed-in client may contribute; the primary key makes re-uploads of a
-- known snapshot conflict instead of duplicating.
create policy "authenticated users insert snapshots"
  on public.formats_snapshots
  for insert
  to authenticated
  with check ((select auth.uid()) = uploaded_by);

-- Game metadata is public; the metadata repo's workflow reads with the anon
-- key. No update/delete policies: snapshots are immutable.
create policy "snapshots are readable by anyone"
  on public.formats_snapshots
  for select
  to anon, authenticated
  using (true);
