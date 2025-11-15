-- Ensure the service carousel bucket exists and is public
insert into storage.buckets (id, name, public)
values ('service-carousel', 'service-carousel', true)
on conflict (id) do update
set public = excluded.public;

-- Allow public reads for the service carousel assets
drop policy if exists "Public access to service carousel" on storage.objects;
create policy "Public access to service carousel"
  on storage.objects
  for select
  using (bucket_id = 'service-carousel');

-- Allow authenticated users to upload new service carousel assets
drop policy if exists "Authenticated users can upload service carousel" on storage.objects;
create policy "Authenticated users can upload service carousel"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'service-carousel');

-- Allow authenticated users to update their service carousel assets
drop policy if exists "Authenticated users can update service carousel" on storage.objects;
create policy "Authenticated users can update service carousel"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'service-carousel')
  with check (bucket_id = 'service-carousel');

-- Allow authenticated users to delete service carousel assets
drop policy if exists "Authenticated users can delete service carousel" on storage.objects;
create policy "Authenticated users can delete service carousel"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'service-carousel');
