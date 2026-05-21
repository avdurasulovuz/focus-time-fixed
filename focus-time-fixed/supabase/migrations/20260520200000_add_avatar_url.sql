-- Add avatar_url to profiles
alter table public.profiles add column if not exists avatar_url text;

-- Storage policy for avatars (reuse book-covers bucket)
create policy "avatars own upload" on storage.objects for insert with check (
  bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[2]
  and (storage.foldername(name))[1] = 'avatars'
) ;

create policy "avatars public read" on storage.objects for select using (
  bucket_id = 'book-covers' and (storage.foldername(name))[1] = 'avatars'
);

create policy "avatars own update" on storage.objects for update using (
  bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[2]
  and (storage.foldername(name))[1] = 'avatars'
);
