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

create table if not exists public.homepage_gallery_backgrounds (
  id uuid primary key default uuid_generate_v4(),
  singleton_key text not null default 'gallery',
  file_path text not null,
  public_url text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint homepage_gallery_backgrounds_singleton unique (singleton_key)
);

drop index if exists homepage_gallery_backgrounds_singleton_idx;
create unique index if not exists homepage_gallery_backgrounds_singleton_idx
  on public.homepage_gallery_backgrounds(singleton_key asc);

create or replace function public.homepage_gallery_backgrounds_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create or replace function public.homepage_gallery_backgrounds_set_created_at()
returns trigger as $$
begin
  if new.created_at is null then
    new.created_at = timezone('utc', now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists homepage_gallery_backgrounds_set_created_at on public.homepage_gallery_backgrounds;
create trigger homepage_gallery_backgrounds_set_created_at
before insert on public.homepage_gallery_backgrounds
for each row execute function public.homepage_gallery_backgrounds_set_created_at();

drop trigger if exists homepage_gallery_backgrounds_set_updated_at on public.homepage_gallery_backgrounds;
create trigger homepage_gallery_backgrounds_set_updated_at
before update on public.homepage_gallery_backgrounds
for each row execute function public.homepage_gallery_backgrounds_set_updated_at();

alter table public.homepage_gallery_backgrounds enable row level security;

drop policy if exists "Public read homepage_gallery_backgrounds" on public.homepage_gallery_backgrounds;
create policy "Public read homepage_gallery_backgrounds"
  on public.homepage_gallery_backgrounds
  for select
  using (true);

drop policy if exists "Admins manage homepage_gallery_backgrounds" on public.homepage_gallery_backgrounds;
create policy "Admins manage homepage_gallery_backgrounds"
  on public.homepage_gallery_backgrounds
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into storage.buckets (id, name, public)
values ('homepage-gallery-background', 'homepage-gallery-background', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public access to homepage gallery background" on storage.objects;
create policy "Public access to homepage gallery background"
  on storage.objects
  for select
  using (bucket_id = 'homepage-gallery-background');

drop policy if exists "Authenticated users can upload homepage gallery background" on storage.objects;
create policy "Authenticated users can upload homepage gallery background"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'homepage-gallery-background');

drop policy if exists "Authenticated users can update homepage gallery background" on storage.objects;
create policy "Authenticated users can update homepage gallery background"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'homepage-gallery-background')
  with check (bucket_id = 'homepage-gallery-background');

drop policy if exists "Authenticated users can delete homepage gallery background" on storage.objects;
create policy "Authenticated users can delete homepage gallery background"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'homepage-gallery-background');
