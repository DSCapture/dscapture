create extension if not exists "uuid-ossp";

alter table public.services
  add column if not exists info_title text,
  add column if not exists info_bullet_points text[],
  add column if not exists gradient_start text,
  add column if not exists gradient_end text;

create table if not exists public.service_portfolio_projects (
  id uuid primary key default uuid_generate_v4(),
  service_slug text not null references public.services(slug) on delete cascade,
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_portfolio_projects_unique unique (service_slug, project_id)
);

create index if not exists service_portfolio_projects_service_idx
  on public.service_portfolio_projects(service_slug, display_order, created_at);

create or replace function public.service_portfolio_projects_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists service_portfolio_projects_set_updated_at on public.service_portfolio_projects;
create trigger service_portfolio_projects_set_updated_at
before update on public.service_portfolio_projects
for each row execute function public.service_portfolio_projects_set_updated_at();
