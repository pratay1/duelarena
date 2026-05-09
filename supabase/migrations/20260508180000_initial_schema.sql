-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (extended with duel.ai features)
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  username text unique not null check (length(username) >= 3 and length(username) <= 30),
  avatar_url text,
  points integer default 0 check (points >= 0),
  tokens integer default 100 check (tokens >= 0),
  games_played integer default 0 check (games_played >= 0),
  current_streak integer default 0 check (current_streak >= 0),
  best_streak integer default 0 check (best_streak >= 0),
  level integer default 1 check (level >= 1),
  lifetime_points integer default 0 check (lifetime_points >= 0),
  last_active timestamptz,
  created_at timestamptz default now()
);

-- CATEGORIES TABLE
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null check (length(name) >= 1 and length(name) <= 50),
  icon text not null check (length(icon) >= 1 and length(icon) <= 30),
  color text not null check (color ~* '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz default now()
);

-- TRIVIA QUESTIONS TABLE
create table trivia_questions (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  question_text text not null check (length(question_text) >= 10 and length(question_text) <= 500),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  created_at timestamptz default now()
);

-- ANSWERS TABLE
create table answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references trivia_questions(id) on delete cascade,
  answer_text text not null check (length(answer_text) >= 1 and length(answer_text) <= 200),
  is_correct boolean not null default false,
  created_at timestamptz default now()
);

-- Add correct_answer_id to trivia_questions
alter table trivia_questions add column correct_answer_id uuid references answers(id);

-- MATCHES TABLE
create table matches (
  id uuid primary key default uuid_generate_v4(),
  player1_id uuid not null references profiles(id) on delete cascade,
  player2_id uuid references profiles(id) on delete set null,
  category_id uuid not null references categories(id) on delete restrict,
  status text not null check (status in ('waiting', 'active', 'completed', 'cancelled')) default 'waiting',
  wager integer default 0 check (wager >= 0),
  winner_id uuid references profiles(id) on delete set null,
  player1_score integer default 0 check (player1_score >= 0),
  player2_score integer default 0 check (player2_score >= 0),
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MATCH ROUNDS TABLE
create table match_rounds (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  round_number integer not null check (round_number >= 1 and round_number <= 20),
  question_id uuid not null references trivia_questions(id) on delete restrict,
  status text not null check (status in ('pending', 'active', 'completed')) default 'pending',
  created_at timestamptz default now()
);

-- PLAYER ANSWERS TABLE
create table player_answers (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid not null references match_rounds(id) on delete cascade,
  player_id uuid not null references profiles(id) on delete cascade,
  answer_id uuid not null references answers(id) on delete restrict,
  is_correct boolean not null default false,
  response_time_ms integer not null check (response_time_ms >= 0 and response_time_ms <= 30000),
  points_earned integer default 0,
  created_at timestamptz default now()
);

-- RANKED SEASONS TABLE
create table ranked_seasons (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null check (length(name) >= 1 and length(name) <= 100),
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz default now()
);

-- LEADERBOARD SNAPSHOTS TABLE
create table leaderboard_snapshots (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid not null references ranked_seasons(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rank integer not null check (rank >= 1),
  points integer not null check (points >= 0),
  created_at timestamptz default now(),
  unique(season_id, user_id, date(created_at))
);

-- FRIENDSHIPS TABLE
create table friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  friend_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- NOTIFICATIONS TABLE
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('match_invite', 'match_result', 'friend_request', 'system', 'achievement')),
  title text not null check (length(title) >= 1 and length(title) <= 100),
  message text not null check (length(message) >= 1 and length(message) <= 500),
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- GAME HISTORY TABLE (new)
create table game_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text,
  score integer default 0,
  tokens_earned integer default 0,
  tokens_wagered integer default 0,
  correct_answers integer default 0,
  total_questions integer default 0,
  duration_seconds integer default 0,
  created_at timestamptz default now()
);

-- INDEXES
create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_username on profiles(username);
create index idx_profiles_tokens on profiles(tokens desc);
create index idx_profiles_points on profiles(points desc);
create index idx_categories_name on categories(name);
create index idx_trivia_questions_category on trivia_questions(category_id);
create index idx_trivia_questions_difficulty on trivia_questions(difficulty);
create index idx_answers_question on answers(question_id);
create index idx_matches_player1 on matches(player1_id);
create index idx_matches_player2 on matches(player2_id);
create index idx_matches_status on matches(status);
create index idx_match_rounds_match on match_rounds(match_id);
create index idx_player_answers_round on player_answers(round_id);
create index idx_player_answers_player on player_answers(player_id);
create index idx_friendships_user on friendships(user_id);
create index idx_friendships_friend on friendships(friend_id);
create index idx_notifications_user on notifications(user_id);
create index idx_game_history_user on game_history(user_id);
create index idx_leaderboard_season on leaderboard_snapshots(season_id);
create index idx_leaderboard_user on leaderboard_snapshots(user_id);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, username, tokens, points, level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Player_' || left(new.id::text, 8)),
    100,
    0,
    1
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed default categories
insert into categories (id, name, icon, color) values
  ('11111111-1111-1111-1111-111111111111', 'General Knowledge', '🧠', '#ff3d00'),
  ('22222222-2222-2222-2222-222222222222', 'Science', '🔬', '#00ff88'),
  ('33333333-3333-3333-3333-333333333333', 'History', '📜', '#ffd700'),
  ('44444444-4444-4444-4444-444444444444', 'Pop Culture', '🎬', '#ff00ff'),
  ('55555555-5555-5555-5555-555555555555', 'Technology', '💻', '#00ccff'),
  ('66666666-6666-6666-6666-666666666666', 'Sports', '⚽', '#ff8800'),
  ('77777777-7777-7777-7777-777777777777', 'Geography', '🌍', '#00ffaa'),
  ('88888888-8888-8888-8888-888888888888', 'Entertainment', '🎮', '#ff5500')
on conflict (id) do nothing;

-- Seed a sample season
insert into ranked_seasons (id, name, start_date, end_date, is_active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Season 1', '2025-01-01', '2025-12-31', true)
on conflict (id) do nothing;