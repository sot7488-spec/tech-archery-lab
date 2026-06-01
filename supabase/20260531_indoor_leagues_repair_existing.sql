-- Repair migration for databases that already created the first indoor league tables.
-- Run this file once in Supabase SQL editor, before using the new jornada/scorecard UI.

create table if not exists public.indoor_league_rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.indoor_leagues(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  round_date date not null,
  created_at timestamp with time zone not null default now(),
  unique (league_id, round_number),
  unique (league_id, round_date)
);

alter table public.indoor_leagues
  add column if not exists rounds_count integer not null default 1 check (rounds_count > 0);

alter table public.indoor_league_results
  add column if not exists round_id uuid;

insert into public.indoor_league_rounds (league_id, round_number, round_date)
select id, 1, start_date
from public.indoor_leagues
where not exists (
  select 1
  from public.indoor_league_rounds
  where indoor_league_rounds.league_id = indoor_leagues.id
);

update public.indoor_league_results
set round_id = indoor_league_rounds.id
from public.indoor_league_rounds
where indoor_league_results.league_id = indoor_league_rounds.league_id
and indoor_league_rounds.round_number = 1
and indoor_league_results.round_id is null;

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

create table if not exists public.indoor_league_result_arrows (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.indoor_league_results(id) on delete cascade,
  arrow_number integer not null check (arrow_number > 0),
  score integer not null check (score >= 0 and score <= 10),
  is_x boolean not null default false,
  created_at timestamp with time zone not null default now(),
  unique (result_id, arrow_number)
);

create table if not exists public.indoor_league_coaches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.indoor_leagues(id) on delete cascade,
  coach_id uuid not null references public.users(id) on delete cascade,
  invited_by uuid references public.users(id),
  invited_at timestamp with time zone not null default now(),
  unique (league_id, coach_id)
);

create table if not exists public.indoor_league_athletes (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.indoor_leagues(id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id),
  enrolled_by uuid references public.users(id),
  enrolled_at timestamp with time zone not null default now(),
  unique (league_id, athlete_id)
);

create index if not exists indoor_league_rounds_league_date_idx
  on public.indoor_league_rounds (league_id, round_date);

create index if not exists indoor_league_results_ranking_idx
  on public.indoor_league_results (league_id, round_id, status, total_score desc, x_count desc, tens_count desc);

alter table public.indoor_league_rounds enable row level security;
alter table public.indoor_league_result_arrows enable row level security;
alter table public.indoor_league_coaches enable row level security;
alter table public.indoor_league_athletes enable row level security;

drop policy if exists "Authenticated users can read indoor rounds" on public.indoor_league_rounds;
drop policy if exists "Admins can manage indoor rounds" on public.indoor_league_rounds;
drop policy if exists "Authenticated users can read indoor result arrows" on public.indoor_league_result_arrows;
drop policy if exists "Athletes can insert arrows for their own indoor result" on public.indoor_league_result_arrows;
drop policy if exists "Authenticated users can read indoor league coaches" on public.indoor_league_coaches;
drop policy if exists "Admins can manage indoor league coaches" on public.indoor_league_coaches;
drop policy if exists "Authenticated users can read indoor league athletes" on public.indoor_league_athletes;
drop policy if exists "Admins and invited coaches can manage indoor league athletes" on public.indoor_league_athletes;

create policy "Authenticated users can read indoor rounds"
  on public.indoor_league_rounds for select
  to authenticated
  using (true);

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

create policy "Authenticated users can read indoor league coaches"
  on public.indoor_league_coaches for select
  to authenticated
  using (true);

create policy "Admins can manage indoor league coaches"
  on public.indoor_league_coaches for all
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

drop policy if exists "Admins can insert indoor league coaches" on public.indoor_league_coaches;

create policy "Admins can insert indoor league coaches"
  on public.indoor_league_coaches for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

create or replace function public.set_indoor_league_coaches(
  p_league_id uuid,
  p_coach_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.users
    where users.id = auth.uid()
    and users.role = 'admin'
  ) then
    raise exception 'Solo admin puede editar coaches invitados.';
  end if;

  delete from public.indoor_league_coaches
  where league_id = p_league_id;

  insert into public.indoor_league_coaches (league_id, coach_id, invited_by)
  select p_league_id, coach_id, auth.uid()
  from unnest(coalesce(p_coach_ids, array[]::uuid[])) as coach_id;
end;
$$;

grant execute on function public.set_indoor_league_coaches(uuid, uuid[]) to authenticated;

create policy "Authenticated users can read indoor league athletes"
  on public.indoor_league_athletes for select
  to authenticated
  using (true);

create policy "Admins and invited coaches can manage indoor league athletes"
  on public.indoor_league_athletes for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and (
        users.role = 'admin'
        or (
          users.role = 'coach'
          and users.club_id = indoor_league_athletes.club_id
          and exists (
            select 1 from public.indoor_league_coaches
            where indoor_league_coaches.league_id = indoor_league_athletes.league_id
            and indoor_league_coaches.coach_id = auth.uid()
          )
        )
      )
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and (
        users.role = 'admin'
        or (
          users.role = 'coach'
          and users.club_id = indoor_league_athletes.club_id
          and exists (
            select 1 from public.indoor_league_coaches
            where indoor_league_coaches.league_id = indoor_league_athletes.league_id
            and indoor_league_coaches.coach_id = auth.uid()
          )
        )
      )
    )
  );
