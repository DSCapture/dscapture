create extension if not exists "uuid-ossp";

create table if not exists public.portfolio_settings (
  id uuid primary key default uuid_generate_v4(),
  hero_headline text,
  hero_subheadline text,
  hero_description text,
  hero_cta_label text,
  hero_cta_url text,
  background_file_path text,
  background_public_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists portfolio_settings_singleton_idx on public.portfolio_settings ((true));

create or replace function public.portfolio_settings_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolio_settings_set_updated_at on public.portfolio_settings;
create trigger portfolio_settings_set_updated_at
before update on public.portfolio_settings
for each row execute function public.portfolio_settings_set_updated_at();

create table if not exists public.portfolio_projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  excerpt text,
  slug text unique,
  cover_public_url text,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists portfolio_projects_display_order_idx on public.portfolio_projects(display_order, created_at);

create or replace function public.portfolio_projects_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolio_projects_set_updated_at on public.portfolio_projects;
create trigger portfolio_projects_set_updated_at
before update on public.portfolio_projects
for each row execute function public.portfolio_projects_set_updated_at();

create table if not exists public.portfolio_project_images (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  caption text,
  file_path text not null,
  public_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists portfolio_project_images_project_idx on public.portfolio_project_images(project_id, display_order, created_at);

insert into storage.buckets (id, name, public)
values
  ('portfolio-backgrounds', 'portfolio-backgrounds', true),
  ('portfolio-covers', 'portfolio-covers', true),
  ('portfolio-project-images', 'portfolio-project-images', true)
on conflict (id) do nothing;
