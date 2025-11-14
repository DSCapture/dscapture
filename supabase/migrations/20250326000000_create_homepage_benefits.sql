create extension if not exists "uuid-ossp";

create table if not exists public.homepage_benefits (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  display_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint homepage_benefits_display_order_check
    check (display_order >= 1 and display_order <= 3)
);

create unique index if not exists homepage_benefits_display_order_idx
  on public.homepage_benefits(display_order);

create or replace function public.homepage_benefits_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists homepage_benefits_set_updated_at on public.homepage_benefits;
create trigger homepage_benefits_set_updated_at
before update on public.homepage_benefits
for each row execute function public.homepage_benefits_set_updated_at();

insert into public.homepage_benefits (display_order, title, description)
values
  (
    1,
    'Strategie & Kreation aus einer Hand',
    'Wir begleiten Ihr Team von der Markenpositionierung bis zur finalen Produktion und sorgen für konsistente Botschaften in jedem Kanal.'
  ),
  (
    2,
    'Prozesse mit messbarem Impact',
    'Transparente Workflows, klare KPIs und regelmäßige Reportings stellen sicher, dass jede Produktion Ihr Business-Ziel unterstützt.'
  ),
  (
    3,
    'Premium Experience für Ihre Zielgruppe',
    'Wir kombinieren High-End-Visuals mit intuitiven digitalen Touchpoints, damit sich Ihre Marke unverwechselbar anfühlt.'
  )
on conflict (display_order) do nothing;
