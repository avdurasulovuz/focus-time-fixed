
-- Fix function search_path for trigger functions (already used SET search_path, but ensure)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end; $$;

-- Restrict storage select to owner only (covers are referenced via direct public-bucket URLs, which still work)
drop policy if exists "book covers public read" on storage.objects;
create policy "book covers own read" on storage.objects for select using (
  bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
);
