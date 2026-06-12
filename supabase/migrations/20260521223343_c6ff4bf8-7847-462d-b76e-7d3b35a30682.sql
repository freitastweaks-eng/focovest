
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar text not null default '🎯',
  vestibular text not null default 'ENEM',
  target_score integer not null default 850,
  study_styles text[] not null default '{}',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "Profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Updated-at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar', '🎯')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Study sessions
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now()
);

alter table public.study_sessions enable row level security;

create policy "Sessions: select own" on public.study_sessions
  for select using (auth.uid() = user_id);
create policy "Sessions: insert own" on public.study_sessions
  for insert with check (auth.uid() = user_id);
create policy "Sessions: delete own" on public.study_sessions
  for delete using (auth.uid() = user_id);

create index study_sessions_user_created_idx on public.study_sessions(user_id, created_at desc);

-- Content favorites
create table public.content_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.content_favorites enable row level security;

create policy "ContentFav: select own" on public.content_favorites
  for select using (auth.uid() = user_id);
create policy "ContentFav: insert own" on public.content_favorites
  for insert with check (auth.uid() = user_id);
create policy "ContentFav: delete own" on public.content_favorites
  for delete using (auth.uid() = user_id);

-- Repertoire favorites
create table public.repertoire_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  repertoire_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, repertoire_id)
);

alter table public.repertoire_favorites enable row level security;

create policy "RepFav: select own" on public.repertoire_favorites
  for select using (auth.uid() = user_id);
create policy "RepFav: insert own" on public.repertoire_favorites
  for insert with check (auth.uid() = user_id);
create policy "RepFav: delete own" on public.repertoire_favorites
  for delete using (auth.uid() = user_id);
