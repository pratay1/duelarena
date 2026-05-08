-- Enable RLS on all tables

-- PROFILES
alter table profiles enable row level security;

create policy "Users can view all profiles"
on profiles for select
to authenticated
using (true);

create policy "Users can insert own profile"
on profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on profiles for update
to authenticated
using (auth.uid() = user_id);

-- CATEGORIES (read-only for all authenticated users)
alter table categories enable row level security;

create policy "Authenticated users can view categories"
on categories for select
to authenticated
using (true);

-- TRIVIA QUESTIONS
alter table trivia_questions enable row level security;

create policy "Authenticated users can view questions"
on trivia_questions for select
to authenticated
using (true);

-- ANSWERS
alter table answers enable row level security;

create policy "Authenticated users can view answers"
on answers for select
to authenticated
using (true);

-- MATCHES
alter table matches enable row level security;

create policy "Users can view own matches"
on matches for select
to authenticated
using (
  player1_id in (select id from profiles where user_id = auth.uid())
  or player2_id in (select id from profiles where user_id = auth.uid())
  or created_by in (select id from profiles where user_id = auth.uid())
);

create policy "Users can create matches"
on matches for insert
to authenticated
with check (
  player1_id in (select id from profiles where user_id = auth.uid())
  and created_by in (select id from profiles where user_id = auth.uid())
);

create policy "Users can update own matches"
on matches for update
to authenticated
using (
  player1_id in (select id from profiles where user_id = auth.uid())
  or player2_id in (select id from profiles where user_id = auth.uid())
);

-- MATCH ROUNDS
alter table match_rounds enable row level security;

create policy "Players can view match rounds"
on match_rounds for select
to authenticated
using (
  match_id in (
    select id from matches 
    where player1_id in (select id from profiles where user_id = auth.uid())
    or player2_id in (select id from profiles where user_id = auth.uid())
  )
);

create policy "System can insert match rounds"
on match_rounds for insert
to authenticated
with check (
  match_id in (
    select id from matches 
    where player1_id in (select id from profiles where user_id = auth.uid())
    or player2_id in (select id from profiles where user_id = auth.uid())
  )
);

-- PLAYER ANSWERS
alter table player_answers enable row level security;

create policy "Players can view own answers"
on player_answers for select
to authenticated
using (player_id in (select id from profiles where user_id = auth.uid()));

create policy "Players can insert own answers"
on player_answers for insert
to authenticated
with check (player_id in (select id from profiles where user_id = auth.uid()));

-- RANKED SEASONS
alter table ranked_seasons enable row level security;

create policy "Users can view ranked seasons"
on ranked_seasons for select
to authenticated
using (true);

-- LEADERBOARD SNAPSHOTS
alter table leaderboard_snapshots enable row level security;

create policy "Users can view leaderboard"
on leaderboard_snapshots for select
to authenticated
using (true);

-- FRIENDSHIPS
alter table friendships enable row level security;

create policy "Users can view own friendships"
on friendships for select
to authenticated
using (user_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can create friend requests"
on friendships for insert
to authenticated
with check (user_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own friendships"
on friendships for update
to authenticated
using (user_id in (select id from profiles where user_id = auth.uid()));

-- NOTIFICATIONS
alter table notifications enable row level security;

create policy "Users can view own notifications"
on notifications for select
to authenticated
using (user_id in (select id from profiles where user_id = auth.uid()));

create policy "Users can update own notifications"
on notifications for update
to authenticated
using (user_id in (select id from profiles where user_id = auth.uid()));