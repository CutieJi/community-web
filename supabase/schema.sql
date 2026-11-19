create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(username) between 2 and 32),
  created_at timestamptz not null default now()
);

create table if not exists public.freedom_posts (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(btrim(message)) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.freedom_post_publications (
  freedom_post_id uuid primary key references public.freedom_posts (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'publishing', 'published', 'failed')),
  facebook_post_id text,
  facebook_published_at timestamptz,
  error_message text,
  updated_at timestamptz not null default now()
);

create table if not exists public.discussion_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  url text check (url is null or url ~* '^https?://'),
  category text not null default 'COMMUNITY PICK',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  url text check (url is null or url ~* '^https?://'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.promotion_requests (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (char_length(btrim(brand)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  url text not null check (url ~* '^https?://'),
  contact_email text not null check (char_length(contact_email) <= 254),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists freedom_posts_status_created_idx on public.freedom_posts (status, created_at desc);
create index if not exists discussion_messages_created_idx on public.discussion_messages (created_at desc);
create index if not exists promotions_published_created_idx on public.promotions (published, created_at desc);
create index if not exists announcements_published_created_idx on public.announcements (published, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'), false);
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      left(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''), 32),
      left(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 32),
      'Community member'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.freedom_posts enable row level security;
alter table public.freedom_post_publications enable row level security;
alter table public.discussion_messages enable row level security;
alter table public.promotions enable row level security;
alter table public.announcements enable row level security;
alter table public.promotion_requests enable row level security;

create policy "Profiles are visible to signed-in members" on public.profiles
  for select to authenticated using (true);
create policy "Admins can manage profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Members can update their own username" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Anyone can submit an anonymous pending post" on public.freedom_posts
  for insert to anon, authenticated with check (status = 'pending');
create policy "Anyone can view approved posts" on public.freedom_posts
  for select to anon, authenticated using (status = 'approved');
create policy "Admins can review all posts" on public.freedom_posts
  for select to authenticated using (public.is_admin());
create policy "Admins can moderate posts" on public.freedom_posts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete posts" on public.freedom_posts
  for delete to authenticated using (public.is_admin());
create policy "Admins can view Facebook publication status" on public.freedom_post_publications
  for select to authenticated using (public.is_admin());

create policy "Members can read discussion" on public.discussion_messages
  for select to authenticated using (true);
create policy "Members can send their own messages" on public.discussion_messages
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins can moderate discussion" on public.discussion_messages
  for delete to authenticated using (public.is_admin());

create policy "Anyone can view published promotions" on public.promotions
  for select to anon, authenticated using (published or public.is_admin());
create policy "Admins can manage promotions" on public.promotions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Anyone can view published announcements" on public.announcements
  for select to anon, authenticated using (published or public.is_admin());
create policy "Admins can manage announcements" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Anyone can submit a pending promotion request" on public.promotion_requests
  for insert to anon, authenticated with check (status = 'pending');
create policy "Admins can review promotion requests" on public.promotion_requests
  for select to authenticated using (public.is_admin());
create policy "Admins can update promotion requests" on public.promotion_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete promotion requests" on public.promotion_requests
  for delete to authenticated using (public.is_admin());

create or replace function public.approve_promotion_request(request_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_row public.promotion_requests%rowtype;
  promotion_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select * into request_row
  from public.promotion_requests
  where id = request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending promotion request not found';
  end if;

  insert into public.promotions (title, description, url, category, published)
  values (request_row.brand, request_row.description, request_row.url, 'COMMUNITY REQUEST', true)
  returning id into promotion_id;

  update public.promotion_requests set status = 'approved' where id = request_row.id;
  return promotion_id;
end;
$$;

revoke all on function public.approve_promotion_request(uuid) from public;
grant execute on function public.approve_promotion_request(uuid) to authenticated;

revoke all on public.profiles, public.freedom_posts, public.freedom_post_publications,
  public.discussion_messages, public.promotions, public.announcements, public.promotion_requests
  from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select (id, message, status, created_at) on public.freedom_posts to anon, authenticated;
grant select on public.promotions, public.announcements to anon, authenticated;
grant insert (message, status) on public.freedom_posts to anon, authenticated;
grant update (status), delete on public.freedom_posts to authenticated;
grant select, insert on public.discussion_messages to authenticated;
grant delete on public.discussion_messages to authenticated;
grant select, update on public.profiles to authenticated;
grant insert, update, delete on public.promotions, public.announcements to authenticated;
grant insert (brand, description, url, contact_email, status) on public.promotion_requests to anon, authenticated;
grant select, update, delete on public.promotion_requests to authenticated;
grant all on public.profiles, public.freedom_posts, public.freedom_post_publications,
  public.discussion_messages, public.promotions, public.announcements, public.promotion_requests
  to service_role;
