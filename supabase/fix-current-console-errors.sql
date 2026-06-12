-- Minimal repair for the current remote database.
-- Run this in the Supabase SQL Editor to fix the dashboard console errors.

begin;

alter table public.profiles
add column if not exists display_name text not null default '',
add column if not exists avatar text not null default 'target',
add column if not exists vestibular text not null default 'ENEM',
add column if not exists study_styles text[] not null default '{}'::text[],
add column if not exists onboarded boolean not null default false;

alter table public.profiles
alter column target_score set default 850;

alter table public.study_sessions
add column if not exists created_at timestamptz not null default now();

create index if not exists study_sessions_user_created_idx
on public.study_sessions (user_id, created_at desc);

create table if not exists public.content_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.content_favorites enable row level security;

drop policy if exists content_favorites_select_own on public.content_favorites;
drop policy if exists content_favorites_insert_own on public.content_favorites;
drop policy if exists content_favorites_delete_own on public.content_favorites;

create policy content_favorites_select_own
on public.content_favorites for select to authenticated
using (auth.uid() = user_id);

create policy content_favorites_insert_own
on public.content_favorites for insert to authenticated
with check (auth.uid() = user_id);

create policy content_favorites_delete_own
on public.content_favorites for delete to authenticated
using (auth.uid() = user_id);

create table if not exists public.repertoire_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  repertoire_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, repertoire_id)
);

alter table public.repertoire_favorites enable row level security;

drop policy if exists repertoire_favorites_select_own on public.repertoire_favorites;
drop policy if exists repertoire_favorites_insert_own on public.repertoire_favorites;
drop policy if exists repertoire_favorites_delete_own on public.repertoire_favorites;

create policy repertoire_favorites_select_own
on public.repertoire_favorites for select to authenticated
using (auth.uid() = user_id);

create policy repertoire_favorites_insert_own
on public.repertoire_favorites for insert to authenticated
with check (auth.uid() = user_id);

create policy repertoire_favorites_delete_own
on public.repertoire_favorites for delete to authenticated
using (auth.uid() = user_id);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject text,
  event_type text not null default 'study',
  color text not null default '#B8FF4F',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

drop policy if exists calendar_events_select_own on public.calendar_events;
drop policy if exists calendar_events_insert_own on public.calendar_events;
drop policy if exists calendar_events_update_own on public.calendar_events;
drop policy if exists calendar_events_delete_own on public.calendar_events;

create policy calendar_events_select_own
on public.calendar_events for select to authenticated
using (auth.uid() = user_id);

create policy calendar_events_insert_own
on public.calendar_events for insert to authenticated
with check (auth.uid() = user_id);

create policy calendar_events_update_own
on public.calendar_events for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy calendar_events_delete_own
on public.calendar_events for delete to authenticated
using (auth.uid() = user_id);

create index if not exists calendar_events_user_starts_idx
on public.calendar_events (user_id, starts_at);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default 'target',
  title text not null,
  content text not null,
  category text not null default 'discussao',
  subject text,
  attachment_url text,
  attachment_type text,
  attachment_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;

drop policy if exists community_posts_select_authenticated on public.community_posts;
drop policy if exists community_posts_insert_own on public.community_posts;
drop policy if exists community_posts_update_own on public.community_posts;
drop policy if exists community_posts_delete_own on public.community_posts;

create policy community_posts_select_authenticated
on public.community_posts for select to authenticated
using (true);

create policy community_posts_insert_own
on public.community_posts for insert to authenticated
with check (auth.uid() = user_id);

create policy community_posts_update_own
on public.community_posts for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy community_posts_delete_own
on public.community_posts for delete to authenticated
using (auth.uid() = user_id);

create index if not exists community_posts_created_idx
on public.community_posts (created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default 'target',
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.community_comments enable row level security;

drop policy if exists community_comments_select_authenticated on public.community_comments;
drop policy if exists community_comments_insert_own on public.community_comments;
drop policy if exists community_comments_update_own on public.community_comments;
drop policy if exists community_comments_delete_own on public.community_comments;

create policy community_comments_select_authenticated
on public.community_comments for select to authenticated
using (true);

create policy community_comments_insert_own
on public.community_comments for insert to authenticated
with check (auth.uid() = user_id);

create policy community_comments_update_own
on public.community_comments for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy community_comments_delete_own
on public.community_comments for delete to authenticated
using (auth.uid() = user_id);

create index if not exists community_comments_post_created_idx
on public.community_comments (post_id, created_at);

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;

drop policy if exists community_likes_select_authenticated on public.community_likes;
drop policy if exists community_likes_insert_own on public.community_likes;
drop policy if exists community_likes_delete_own on public.community_likes;

create policy community_likes_select_authenticated
on public.community_likes for select to authenticated
using (true);

create policy community_likes_insert_own
on public.community_likes for insert to authenticated
with check (auth.uid() = user_id);

create policy community_likes_delete_own
on public.community_likes for delete to authenticated
using (auth.uid() = user_id);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  renewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_status_check
    check (status in ('active', 'expired', 'canceled'))
);

alter table public.user_subscriptions enable row level security;

drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
drop policy if exists user_subscriptions_insert_own on public.user_subscriptions;
drop policy if exists user_subscriptions_update_own on public.user_subscriptions;

create policy user_subscriptions_select_own
on public.user_subscriptions for select to authenticated
using (auth.uid() = user_id);

create policy user_subscriptions_insert_own
on public.user_subscriptions for insert to authenticated
with check (auth.uid() = user_id);

create policy user_subscriptions_update_own
on public.user_subscriptions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_subscriptions_user_expires_idx
on public.user_subscriptions (user_id, expires_at desc);

notify pgrst, 'reload schema';

commit;
