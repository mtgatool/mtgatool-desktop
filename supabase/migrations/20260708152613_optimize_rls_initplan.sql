-- Wrap auth.uid() in a scalar subselect so the planner evaluates it once per
-- query instead of per row (Supabase auth_rls_initplan advisory).

-- profiles
alter policy profiles_update_own on public.profiles
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- owner policies (FOR ALL)
alter policy arena_accounts_owner on public.arena_accounts
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy matches_owner on public.matches
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy decks_owner on public.decks
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy arena_collection_owner on public.arena_collection
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy arena_inventory_owner on public.arena_inventory
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy arena_ranks_owner on public.arena_ranks
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
