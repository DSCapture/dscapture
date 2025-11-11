create extension if not exists "uuid-ossp";

create table if not exists public.homepage_usps (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  display_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.homepage_usps_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists homepage_usps_set_updated_at on public.homepage_usps;
create trigger homepage_usps_set_updated_at
before update on public.homepage_usps
for each row execute function public.homepage_usps_set_updated_at();

create unique index if not exists homepage_usps_display_order_idx
  on public.homepage_usps(display_order);

insert into public.homepage_usps (display_order, title, description)
values
  (
    1,
    'Ganzheitliche Markenstrategie',
    'Wir verbinden Analyse, Beratung und Umsetzung zu einer klaren Roadmap für Ihre Markenentwicklung.'
  ),
  (
    2,
    'Premium Visual Storytelling',
    'Inszenierungen, die Emotionen wecken: Von Fotografie bis Film entsteht ein konsistentes Markenerlebnis.'
  ),
  (
    3,
    'Messbare digitale Ergebnisse',
    'Kreationen, die performen – wir gestalten digitale Experiences mit klaren KPIs und spürbarer Wirkung.'
  )
on conflict (display_order) do nothing;
