alter table public.portfolio_project_images
  add column if not exists alt_text text,
  add column if not exists meta_tags text[];
