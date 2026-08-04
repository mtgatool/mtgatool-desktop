create table if not exists public.live_overlays (
  share_id text primary key,
  user_id uuid not null default auth.uid(),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.live_overlays enable row level security;

-- Public (anon) can read any row — share_id is an unguessable capability token,
-- and the live viewer at /live/<shareId> is intentionally unauthenticated.
drop policy if exists "live_overlays public read" on public.live_overlays;
create policy "live_overlays public read"
  on public.live_overlays for select
  using (true);

-- Authenticated desktop users publish/update only their own rows.
drop policy if exists "live_overlays owner insert" on public.live_overlays;
create policy "live_overlays owner insert"
  on public.live_overlays for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "live_overlays owner update" on public.live_overlays;
create policy "live_overlays owner update"
  on public.live_overlays for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "live_overlays owner delete" on public.live_overlays;
create policy "live_overlays owner delete"
  on public.live_overlays for delete to authenticated
  using (user_id = auth.uid());

grant select on public.live_overlays to anon, authenticated;
grant insert, update, delete on public.live_overlays to authenticated;

-- Stale rows pile up (crashes, closed overlays). Index updated_at so a periodic
-- cleanup of old rows is cheap.
create index if not exists live_overlays_updated_at_idx
  on public.live_overlays (updated_at);
