create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
as $$
  select check_user_id is not null
    and exists (
      select 1
      from public."adminUsers" au
      where au.user_id = check_user_id
        and coalesce(au.role, 'user') = 'admin'
    );
$$;

comment on function public.is_admin is 'Helper used by RLS policies to check if the current auth.uid() belongs to an admin.';

-- Activity logs
alter table public.activity_logs enable row level security;

drop policy if exists "Public inserts activity_logs" on public.activity_logs;
create policy "Public inserts activity_logs"
  on public.activity_logs
  for insert
  to public
  with check (true);

drop policy if exists "Admins read activity_logs" on public.activity_logs;
create policy "Admins read activity_logs"
  on public.activity_logs
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update activity_logs" on public.activity_logs;
create policy "Admins update activity_logs"
  on public.activity_logs
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete activity_logs" on public.activity_logs;
create policy "Admins delete activity_logs"
  on public.activity_logs
  for delete
  using (public.is_admin(auth.uid()));

-- Admin users
alter table public."adminUsers" enable row level security;

drop policy if exists "Admins read themselves" on public."adminUsers";
create policy "Admins read themselves"
  on public."adminUsers"
  for select
  using (auth.uid() = user_id);

-- Blog categories
alter table public.blog_categories enable row level security;

drop policy if exists "Public read blog_categories" on public.blog_categories;
create policy "Public read blog_categories"
  on public.blog_categories
  for select
  using (true);

drop policy if exists "Admins manage blog_categories" on public.blog_categories;
create policy "Admins manage blog_categories"
  on public.blog_categories
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update blog_categories" on public.blog_categories;
create policy "Admins update blog_categories"
  on public.blog_categories
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete blog_categories" on public.blog_categories;
create policy "Admins delete blog_categories"
  on public.blog_categories
  for delete
  using (public.is_admin(auth.uid()));

-- Contact messages
alter table public.contact_messages enable row level security;

drop policy if exists "Public insert contact_messages" on public.contact_messages;
create policy "Public insert contact_messages"
  on public.contact_messages
  for insert
  to public
  with check (true);

drop policy if exists "Admins read contact_messages" on public.contact_messages;
create policy "Admins read contact_messages"
  on public.contact_messages
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update contact_messages" on public.contact_messages;
create policy "Admins update contact_messages"
  on public.contact_messages
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete contact_messages" on public.contact_messages;
create policy "Admins delete contact_messages"
  on public.contact_messages
  for delete
  using (public.is_admin(auth.uid()));

-- Homepage benefits
alter table public.homepage_benefits enable row level security;

drop policy if exists "Public read homepage_benefits" on public.homepage_benefits;
create policy "Public read homepage_benefits"
  on public.homepage_benefits
  for select
  using (true);

drop policy if exists "Admins manage homepage_benefits" on public.homepage_benefits;
create policy "Admins manage homepage_benefits"
  on public.homepage_benefits
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update homepage_benefits" on public.homepage_benefits;
create policy "Admins update homepage_benefits"
  on public.homepage_benefits
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete homepage_benefits" on public.homepage_benefits;
create policy "Admins delete homepage_benefits"
  on public.homepage_benefits
  for delete
  using (public.is_admin(auth.uid()));

-- Homepage images
alter table public.homepage_images enable row level security;

drop policy if exists "Public read homepage_images" on public.homepage_images;
create policy "Public read homepage_images"
  on public.homepage_images
  for select
  using (true);

drop policy if exists "Admins insert homepage_images" on public.homepage_images;
create policy "Admins insert homepage_images"
  on public.homepage_images
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update homepage_images" on public.homepage_images;
create policy "Admins update homepage_images"
  on public.homepage_images
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete homepage_images" on public.homepage_images;
create policy "Admins delete homepage_images"
  on public.homepage_images
  for delete
  using (public.is_admin(auth.uid()));

-- Homepage photographer intro
alter table public.homepage_photographer_intro enable row level security;

drop policy if exists "Public read homepage_photographer_intro" on public.homepage_photographer_intro;
create policy "Public read homepage_photographer_intro"
  on public.homepage_photographer_intro
  for select
  using (true);

drop policy if exists "Admins manage homepage_photographer_intro" on public.homepage_photographer_intro;
create policy "Admins manage homepage_photographer_intro"
  on public.homepage_photographer_intro
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Homepage reviews
alter table public.homepage_reviews enable row level security;

drop policy if exists "Public read homepage_reviews" on public.homepage_reviews;
create policy "Public read homepage_reviews"
  on public.homepage_reviews
  for select
  using (true);

drop policy if exists "Admins insert homepage_reviews" on public.homepage_reviews;
create policy "Admins insert homepage_reviews"
  on public.homepage_reviews
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update homepage_reviews" on public.homepage_reviews;
create policy "Admins update homepage_reviews"
  on public.homepage_reviews
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete homepage_reviews" on public.homepage_reviews;
create policy "Admins delete homepage_reviews"
  on public.homepage_reviews
  for delete
  using (public.is_admin(auth.uid()));

-- Homepage USPs
alter table public.homepage_usps enable row level security;

drop policy if exists "Public read homepage_usps" on public.homepage_usps;
create policy "Public read homepage_usps"
  on public.homepage_usps
  for select
  using (true);

drop policy if exists "Admins manage homepage_usps" on public.homepage_usps;
create policy "Admins manage homepage_usps"
  on public.homepage_usps
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update homepage_usps" on public.homepage_usps;
create policy "Admins update homepage_usps"
  on public.homepage_usps
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete homepage_usps" on public.homepage_usps;
create policy "Admins delete homepage_usps"
  on public.homepage_usps
  for delete
  using (public.is_admin(auth.uid()));

-- Page metadata
alter table public.page_metadata enable row level security;

drop policy if exists "Public read page_metadata" on public.page_metadata;
create policy "Public read page_metadata"
  on public.page_metadata
  for select
  using (true);

drop policy if exists "Admins insert page_metadata" on public.page_metadata;
create policy "Admins insert page_metadata"
  on public.page_metadata
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update page_metadata" on public.page_metadata;
create policy "Admins update page_metadata"
  on public.page_metadata
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete page_metadata" on public.page_metadata;
create policy "Admins delete page_metadata"
  on public.page_metadata
  for delete
  using (public.is_admin(auth.uid()));

-- Portfolio project images
alter table public.portfolio_project_images enable row level security;

drop policy if exists "Public read portfolio_project_images" on public.portfolio_project_images;
create policy "Public read portfolio_project_images"
  on public.portfolio_project_images
  for select
  using (true);

drop policy if exists "Admins insert portfolio_project_images" on public.portfolio_project_images;
create policy "Admins insert portfolio_project_images"
  on public.portfolio_project_images
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update portfolio_project_images" on public.portfolio_project_images;
create policy "Admins update portfolio_project_images"
  on public.portfolio_project_images
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete portfolio_project_images" on public.portfolio_project_images;
create policy "Admins delete portfolio_project_images"
  on public.portfolio_project_images
  for delete
  using (public.is_admin(auth.uid()));

-- Portfolio projects
alter table public.portfolio_projects enable row level security;

drop policy if exists "Public read portfolio_projects" on public.portfolio_projects;
create policy "Public read portfolio_projects"
  on public.portfolio_projects
  for select
  using (true);

drop policy if exists "Admins insert portfolio_projects" on public.portfolio_projects;
create policy "Admins insert portfolio_projects"
  on public.portfolio_projects
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update portfolio_projects" on public.portfolio_projects;
create policy "Admins update portfolio_projects"
  on public.portfolio_projects
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete portfolio_projects" on public.portfolio_projects;
create policy "Admins delete portfolio_projects"
  on public.portfolio_projects
  for delete
  using (public.is_admin(auth.uid()));

-- Portfolio settings
alter table public.portfolio_settings enable row level security;

drop policy if exists "Public read portfolio_settings" on public.portfolio_settings;
create policy "Public read portfolio_settings"
  on public.portfolio_settings
  for select
  using (true);

drop policy if exists "Admins manage portfolio_settings" on public.portfolio_settings;
create policy "Admins manage portfolio_settings"
  on public.portfolio_settings
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Posts
alter table public.posts enable row level security;

drop policy if exists "Public read posts" on public.posts;
create policy "Public read posts"
  on public.posts
  for select
  using (true);

drop policy if exists "Admins insert posts" on public.posts;
create policy "Admins insert posts"
  on public.posts
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update posts" on public.posts;
create policy "Admins update posts"
  on public.posts
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete posts" on public.posts;
create policy "Admins delete posts"
  on public.posts
  for delete
  using (public.is_admin(auth.uid()));

-- Service portfolio projects
alter table public.service_portfolio_projects enable row level security;

drop policy if exists "Public read service_portfolio_projects" on public.service_portfolio_projects;
create policy "Public read service_portfolio_projects"
  on public.service_portfolio_projects
  for select
  using (true);

drop policy if exists "Admins insert service_portfolio_projects" on public.service_portfolio_projects;
create policy "Admins insert service_portfolio_projects"
  on public.service_portfolio_projects
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update service_portfolio_projects" on public.service_portfolio_projects;
create policy "Admins update service_portfolio_projects"
  on public.service_portfolio_projects
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete service_portfolio_projects" on public.service_portfolio_projects;
create policy "Admins delete service_portfolio_projects"
  on public.service_portfolio_projects
  for delete
  using (public.is_admin(auth.uid()));

-- Service slide images
alter table public.service_slide_images enable row level security;

drop policy if exists "Public read service_slide_images" on public.service_slide_images;
create policy "Public read service_slide_images"
  on public.service_slide_images
  for select
  using (true);

drop policy if exists "Admins insert service_slide_images" on public.service_slide_images;
create policy "Admins insert service_slide_images"
  on public.service_slide_images
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update service_slide_images" on public.service_slide_images;
create policy "Admins update service_slide_images"
  on public.service_slide_images
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete service_slide_images" on public.service_slide_images;
create policy "Admins delete service_slide_images"
  on public.service_slide_images
  for delete
  using (public.is_admin(auth.uid()));

-- Services
alter table public.services enable row level security;

drop policy if exists "Public read services" on public.services;
create policy "Public read services"
  on public.services
  for select
  using (true);

drop policy if exists "Admins insert services" on public.services;
create policy "Admins insert services"
  on public.services
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins update services" on public.services;
create policy "Admins update services"
  on public.services
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins delete services" on public.services;
create policy "Admins delete services"
  on public.services
  for delete
  using (public.is_admin(auth.uid()));
