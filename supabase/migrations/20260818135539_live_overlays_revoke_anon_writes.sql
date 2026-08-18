-- Only the desktop app writes live_overlays, and only with a logged-in session:
-- user_id defaults to auth.uid() and every write policy is `to authenticated`.
-- Supabase's default privileges still hand anon insert/update/delete on any
-- table created in public, so RLS is the only thing refusing an anonymous
-- write. Take the grants away as well, so a future policy mistake cannot open
-- the table to the world.
revoke insert, update, delete on public.live_overlays from anon;

-- The viewer at /live/<share_id> is intentionally unauthenticated: it reads the
-- row by its unguessable share_id and never writes. Keep that read.
grant select on public.live_overlays to anon;
