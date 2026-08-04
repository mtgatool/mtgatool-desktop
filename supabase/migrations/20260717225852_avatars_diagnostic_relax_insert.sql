-- Diagnostic: does storage recognize the authenticated role from the (ES256)
-- user JWT at all? Drop the name = auth.uid() check temporarily.
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars authed insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');
