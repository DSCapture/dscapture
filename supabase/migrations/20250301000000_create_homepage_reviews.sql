create extension if not exists "uuid-ossp";

create table if not exists public.homepage_reviews (
  id uuid primary key default uuid_generate_v4(),
  author text not null,
  role text,
  quote text not null,
  rating smallint not null default 5,
  display_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.homepage_reviews
  add constraint homepage_reviews_rating_check
  check (rating >= 1 and rating <= 5);

create or replace function public.homepage_reviews_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists homepage_reviews_set_updated_at on public.homepage_reviews;
create trigger homepage_reviews_set_updated_at
before update on public.homepage_reviews
for each row execute function public.homepage_reviews_set_updated_at();

create unique index if not exists homepage_reviews_display_order_idx
  on public.homepage_reviews(display_order);

insert into public.homepage_reviews (display_order, author, role, quote, rating)
values
  (
    1,
    'Studio Blend',
    'Creative Director',
    'DS_Capture hat unsere Marke mit einem konsistenten visuellen Leitbild gestärkt. Der Prozess war fokussiert und hocheffizient.',
    5
  ),
  (
    2,
    'NXT Ventures',
    'Head of Marketing',
    'Von der Strategie bis zur Umsetzung: Das Team hat komplexe Inhalte in klare, inspirierende Kampagnen übersetzt.',
    5
  ),
  (
    3,
    'Urban Pulse',
    'CEO',
    'Die Zusammenarbeit war partnerschaftlich und transparent. Unsere digitale Präsenz performt messbar besser.',
    5
  ),
  (
    4,
    'Lumen Architects',
    'Managing Partner',
    'Dank DS_Capture sprechen wir unsere Zielgruppe jetzt präzise an – visuell stark und inhaltlich auf den Punkt.',
    5
  )
on conflict (display_order) do nothing;
