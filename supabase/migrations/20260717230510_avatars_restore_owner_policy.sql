-- Not used by the client for now (avatars live on profiles.avatar_url), but
-- keep the bucket correctly locked down (owner-only writes) for future use once
-- the storage service honours the user JWT.
drop policy if exists "avatars authed insert" on storage.objects;
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text);
