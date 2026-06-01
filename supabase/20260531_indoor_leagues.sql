-- TAL indoor virtual interclub leagues.
-- Run this in the Supabase SQL editor before using /leagues.

create table if not exists public.indoor_leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  category text not null check (category in ('iniciacion', 'infantil', 'juvenil', 'abierta')),
  bow_type text not null check (bow_type in ('recurvo', 'compuesto', 'barebow')),
  gender text not null default 'mixta' check (gender = 'mixta'),
  distance_meters integer not null default 18 check (distance_meters = 18),
  target_size_cm integer not null default 40,
  arrows_count integer not null default 60,
  rounds_count integer not null default 1 check (rounds_count > 0),
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  created_by uuid not null references public.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.indoor_league_rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.indoor_leagues(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  round_date date not null,
  created_at timestamp with time zone not null default now(),
  unique (league_id, round_number),
  unique (league_id, round_date)
);

create table if not exists public.indoor_league_clubs (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.indoor_leagues(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  joined_by uuid references public.users(id),
  joined_at timestamp with time zone not null default now(),
  unique (league_id, club_id)
);

create table if not exists public.indoor_league_results (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.indoor_leagues(id) on delete cascade,
  round_id uuid not null references public.indoor_league_rounds(id) on delete cascade,
  club_id uuid not null references public.clubs(id),
  athlete_id uuid not null references public.athlete_profiles(id),
  submitted_by uuid not null references public.users(id),
  total_score integer not null check (total_score >= 0),
  x_count integer not null default 0 check (x_count >= 0),
  tens_count integer not null default 0 check (tens_count >= 0),
  evidence_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'validated', 'rejected')),
  submitted_at timestamp with time zone not null default now(),
  validated_by uuid references public.users(id),
  validated_at timestamp with time zone,
  unique (round_id, athlete_id)
);

create table if not exists public.indoor_league_result_arrows (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.indoor_league_results(id) on delete cascade,
  arrow_number integer not null check (arrow_number > 0),
  score integer not null check (score >= 0 and score <= 10),
  is_x boolean not null default false,
  created_at timestamp with time zone not null default now(),
  unique (result_id, arrow_number)
);

-- Compatibility upgrades in case an earlier version of this script already
-- created the tables with the old one-result-per-league structure.
alter table public.indoor_leagues
  add column if not exists rounds_count integer not null default 1 check (rounds_count > 0);

alter table public.indoor_league_results
  add column if not exists round_id uuid,
  add column if not exists evidence_url text,
  add column if not exists notes text,
  add column if not exists validated_by uuid references public.users(id),
  add column if not exists validated_at timestamp with time zone;

alter table public.indoor_league_results
  drop constraint if exists indoor_league_results_league_id_athlete_id_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'indoor_league_results_round_id_fkey'
  ) then
    alter table public.indoor_league_results
      add constraint indoor_league_results_round_id_fkey
      foreign key (round_id)
      references public.indoor_league_rounds(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'indoor_league_results_round_id_athlete_id_key'
  ) then
    alter table public.indoor_league_results
      add constraint indoor_league_results_round_id_athlete_id_key
      unique (round_id, athlete_id);
  end if;
end $$;

create index if not exists indoor_leagues_status_dates_idx
  on public.indoor_leagues (status, start_date, end_date);

create index if not exists indoor_league_rounds_league_date_idx
  on public.indoor_league_rounds (league_id, round_date);

create index if not exists indoor_league_results_ranking_idx
  on public.indoor_league_results (league_id, round_id, status, total_score desc, x_count desc, tens_count desc);

alter table public.indoor_leagues enable row level security;
alter table public.indoor_league_rounds enable row level security;
alter table public.indoor_league_clubs enable row level security;
alter table public.indoor_league_results enable row level security;
alter table public.indoor_league_result_arrows enable row level security;

drop policy if exists "Authenticated users can read indoor leagues" on public.indoor_leagues;
drop policy if exists "Authenticated users can read indoor rounds" on public.indoor_league_rounds;
drop policy if exists "Admins can manage indoor leagues" on public.indoor_leagues;
drop policy if exists "Admins can manage indoor rounds" on public.indoor_league_rounds;
drop policy if exists "Authenticated users can read indoor league clubs" on public.indoor_league_clubs;
drop policy if exists "Admins and club coaches can join indoor leagues" on public.indoor_league_clubs;
drop policy if exists "Authenticated users can read indoor league results" on public.indoor_league_results;
drop policy if exists "Athletes can submit their own indoor results" on public.indoor_league_results;
drop policy if exists "Admins can update indoor results" on public.indoor_league_results;
drop policy if exists "Authenticated users can read indoor result arrows" on public.indoor_league_result_arrows;
drop policy if exists "Athletes can insert arrows for their own indoor result" on public.indoor_league_result_arrows;

create policy "Authenticated users can read indoor leagues"
  on public.indoor_leagues for select
  to authenticated
  using (true);

create policy "Authenticated users can read indoor rounds"
  on public.indoor_league_rounds for select
  to authenticated
  using (true);

create policy "Admins can manage indoor leagues"
  on public.indoor_leagues for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

create policy "Admins can manage indoor rounds"
  on public.indoor_league_rounds for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

create policy "Authenticated users can read indoor league clubs"
  on public.indoor_league_clubs for select
  to authenticated
  using (true);

create policy "Admins and club coaches can join indoor leagues"
  on public.indoor_league_clubs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and (
        users.role = 'admin'
        or (users.role = 'coach' and users.club_id = indoor_league_clubs.club_id)
      )
    )
  );

create policy "Authenticated users can read indoor league results"
  on public.indoor_league_results for select
  to authenticated
  using (true);

create policy "Athletes can submit their own indoor results"
  on public.indoor_league_results for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = indoor_league_results.athlete_id
      and athlete_profiles.user_id = auth.uid()
      and users.role = 'athlete'
    )
  );

create policy "Admins can update indoor results"
  on public.indoor_league_results for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

create policy "Authenticated users can read indoor result arrows"
  on public.indoor_league_result_arrows for select
  to authenticated
  using (true);

create policy "Athletes can insert arrows for their own indoor result"
  on public.indoor_league_result_arrows for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.indoor_league_results
      join public.athlete_profiles on athlete_profiles.id = indoor_league_results.athlete_id
      where indoor_league_results.id = indoor_league_result_arrows.result_id
      and athlete_profiles.user_id = auth.uid()
    )
  );
