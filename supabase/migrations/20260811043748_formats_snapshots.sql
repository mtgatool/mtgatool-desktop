-- Live GetFormats snapshots, uploaded by clients when Arena hands them a
-- formats table this client has not pushed before. The sha256 of the
-- normalized payload is the version; one row is one account ATTESTING to one
-- snapshot, so mtgatool-metadata's auto-update can require a quorum of
-- distinct uploaders before adopting a table — a single hostile account
-- cannot get a doctored snapshot released.
--
-- Every attester carries its own copy of the content, and the consumer
-- recomputes the hash of each row's content before trusting it: a row whose
-- formats do not hash to its claimed key is ignored, so pre-claiming a hash
-- with junk content only wastes the attacker's row.

create table public.formats_snapshots (
  hash text not null,
  -- json, not jsonb: jsonb re-orders object keys, which would break
  -- recomputing the content hash on the way out.
  formats json not null,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (hash, uploaded_by)
);

alter table public.formats_snapshots enable row level security;

-- Any signed-in account may attest; the primary key caps it at one
-- attestation per account per snapshot.
create policy "authenticated users attest snapshots"
  on public.formats_snapshots
  for insert
  to authenticated
  with check ((select auth.uid()) = uploaded_by);

-- Game metadata is public; the metadata repo's workflow reads with the anon
-- key. No update/delete policies: attestations are immutable.
create policy "snapshots are readable by anyone"
  on public.formats_snapshots
  for select
  to anon, authenticated
  using (true);

-- Attestation counts per snapshot, for the consumer's quorum check.
-- first_seen never moves once a hash exists, so "newest hash with quorum"
-- is a stable ordering.
create view public.formats_snapshot_quorum
  with (security_invoker = true) as
  select
    hash,
    count(distinct uploaded_by) as uploaders,
    min(created_at) as first_seen
  from public.formats_snapshots
  group by hash;
