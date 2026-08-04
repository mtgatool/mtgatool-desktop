-- Default user_id from the JWT so clients never send it (and cannot set it to
-- someone else's id — the RLS WITH CHECK still enforces it regardless).
alter table public.arena_accounts alter column user_id set default auth.uid();
alter table public.matches alter column user_id set default auth.uid();
alter table public.decks alter column user_id set default auth.uid();
alter table public.arena_collection alter column user_id set default auth.uid();
alter table public.arena_inventory alter column user_id set default auth.uid();
alter table public.arena_ranks alter column user_id set default auth.uid();
