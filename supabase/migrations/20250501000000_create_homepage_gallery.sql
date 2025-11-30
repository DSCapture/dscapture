create extension if not exists "uuid-ossp";

-- Ensure admin helper exists for policies in environments where earlier migrations haven't run yet
create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
as $$
  select check_user_id is not null
    and exists (
      select 1
      from public."adminUsers" au
      where au.user_id = check_user_id
        and coalesce(au.role, 'user') = 'admin'
    );
$$;

create table if not exists public.homepage_gallery_images (
  id uuid primary key default uuid_generate_v4(),
  file_path text not null,
  public_url text not null,
  alt_text text,
  display_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists homepage_gallery_images_display_order_idx
  on public.homepage_gallery_images(display_order asc);

create index if not exists homepage_gallery_images_created_at_idx
  on public.homepage_gallery_images(created_at desc);

create or replace function public.homepage_gallery_images_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create or replace function public.homepage_gallery_images_set_created_at()
returns trigger as $$
begin
  if new.created_at is null then
    new.created_at = timezone('utc', now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists homepage_gallery_images_set_created_at on public.homepage_gallery_images;
create trigger homepage_gallery_images_set_created_at
before insert on public.homepage_gallery_images
for each row execute function public.homepage_gallery_images_set_created_at();

drop trigger if exists homepage_gallery_images_set_updated_at on public.homepage_gallery_images;
create trigger homepage_gallery_images_set_updated_at
before update on public.homepage_gallery_images
for each row execute function public.homepage_gallery_images_set_updated_at();

alter table public.homepage_gallery_images enable row level security;

drop policy if exists "Public read homepage_gallery_images" on public.homepage_gallery_images;
create policy "Public read homepage_gallery_images"
  on public.homepage_gallery_images
  for select
  using (true);

drop policy if exists "Admins manage homepage_gallery_images" on public.homepage_gallery_images;
create policy "Admins manage homepage_gallery_images"
  on public.homepage_gallery_images
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into storage.buckets (id, name, public)
values ('homepage-gallery', 'homepage-gallery', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public access to homepage gallery" on storage.objects;
create policy "Public access to homepage gallery"
  on storage.objects
  for select
  using (bucket_id = 'homepage-gallery');

drop policy if exists "Authenticated users can upload homepage gallery" on storage.objects;
create policy "Authenticated users can upload homepage gallery"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'homepage-gallery');

drop policy if exists "Authenticated users can update homepage gallery" on storage.objects;
create policy "Authenticated users can update homepage gallery"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'homepage-gallery')
  with check (bucket_id = 'homepage-gallery');

drop policy if exists "Authenticated users can delete homepage gallery" on storage.objects;
create policy "Authenticated users can delete homepage gallery"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'homepage-gallery');
