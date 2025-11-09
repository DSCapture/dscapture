do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'portfolio_projects'
      and column_name = 'location'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'portfolio_projects'
      and column_name = 'category'
  ) then
    alter table public.portfolio_projects
      rename column location to category;
  end if;
end
$$;

alter table public.portfolio_projects
  add column if not exists subtitle text;
