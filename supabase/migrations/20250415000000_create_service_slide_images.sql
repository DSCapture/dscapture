create extension if not exists "uuid-ossp";

create table if not exists public.service_slide_images (
  id uuid primary key default uuid_generate_v4(),
  service_slug text not null references public.services(slug) on delete cascade,
  file_path text not null,
  public_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_slide_images_service_slug_key unique (service_slug)
);

create index if not exists service_slide_images_service_slug_idx
  on public.service_slide_images(service_slug);

create or replace function public.service_slide_images_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create or replace function public.service_slide_images_set_created_at()
returns trigger as $$
begin
  if new.created_at is null then
    new.created_at = timezone('utc', now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists service_slide_images_set_created_at on public.service_slide_images;
create trigger service_slide_images_set_created_at
before insert on public.service_slide_images
for each row execute function public.service_slide_images_set_created_at();

drop trigger if exists service_slide_images_set_updated_at on public.service_slide_images;
create trigger service_slide_images_set_updated_at
before update on public.service_slide_images
for each row execute function public.service_slide_images_set_updated_at();

insert into public.service_slide_images (service_slug, file_path, public_url)
select slug, image_path, null
from public.services
where image_path is not null
on conflict (service_slug) do nothing;
