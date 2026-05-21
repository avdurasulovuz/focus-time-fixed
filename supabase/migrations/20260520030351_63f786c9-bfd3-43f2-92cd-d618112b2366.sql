
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  total_focus_minutes integer not null default 0,
  total_pomos integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  tree_planted_at date not null default current_date,
  tree_stage integer not null default 0,
  settings jsonb not null default '{"focus":25,"short":5,"long":15,"interval":4,"sound":true,"notif":false,"autobreak":false,"dailyGoalMinutes":60}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- POMODORO SESSIONS
create table public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_minutes integer not null,
  mode text not null default 'focus',
  completed_at timestamptz not null default now()
);
alter table public.pomodoro_sessions enable row level security;
create policy "own sessions all" on public.pomodoro_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index pomo_user_date_idx on public.pomodoro_sessions(user_id, completed_at desc);

-- DAILY STATS
create table public.daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  focus_minutes integer not null default 0,
  pomos integer not null default 0,
  primary key (user_id, date)
);
alter table public.daily_stats enable row level security;
create policy "own daily all" on public.daily_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASKS
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "own tasks all" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- BOOKS
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  notes text,
  status text not null default 'reading',
  created_at timestamptz not null default now()
);
alter table public.books enable row level security;
create policy "own books all" on public.books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AUTO PROFILE on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- updated_at trigger for profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles
for each row execute procedure public.touch_updated_at();

-- STORAGE bucket for book covers (public read)
insert into storage.buckets (id, name, public) values ('book-covers','book-covers', true)
on conflict (id) do nothing;

create policy "book covers public read" on storage.objects for select using (bucket_id = 'book-covers');
create policy "book covers own upload" on storage.objects for insert with check (
  bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "book covers own update" on storage.objects for update using (
  bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "book covers own delete" on storage.objects for delete using (
  bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]
);
