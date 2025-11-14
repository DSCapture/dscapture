alter table public.portfolio_project_images
  drop column if exists meta_tags,
  add column if not exists alt_text text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text;
