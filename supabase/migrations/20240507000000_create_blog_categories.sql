create extension if not exists "uuid-ossp";

create table if not exists public.blog_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.posts
  add column if not exists category_id uuid references public.blog_categories(id) on delete set null;

create index if not exists posts_category_id_idx on public.posts(category_id);
