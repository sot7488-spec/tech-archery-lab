-- TAL conditioning routines.
-- Adds physical trainer profiles capable of creating athlete-specific routines.

alter table public.performance_staff
  add column if not exists user_id uuid references public.users(id) on delete set null;

create unique index if not exists performance_staff_user_id_key
  on public.performance_staff (user_id)
  where user_id is not null;

create table if not exists public.conditioning_routines (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid references public.performance_staff(id) on delete set null,
  goal_id uuid references public.athlete_goals(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  objective text,
  phase text,
  frequency_per_week integer not null default 3 check (frequency_per_week between 1 and 7),
  duration_weeks integer not null default 4 check (duration_weeks between 1 and 52),
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'paused')),
  notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.conditioning_routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.conditioning_routines(id) on delete cascade,
  exercise_order integer not null default 1 check (exercise_order > 0),
  name text not null,
  focus_area text,
  sets text,
  reps text,
  load text,
  rest text,
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists conditioning_routines_athlete_status_idx
  on public.conditioning_routines (athlete_id, status, start_date desc);

create index if not exists conditioning_routines_staff_idx
  on public.conditioning_routines (staff_id, start_date desc);

create index if not exists conditioning_routine_exercises_routine_idx
  on public.conditioning_routine_exercises (routine_id, exercise_order);

alter table public.conditioning_routines enable row level security;
alter table public.conditioning_routine_exercises enable row level security;

drop policy if exists "Conditioning routines scoped access" on public.conditioning_routines;
drop policy if exists "Conditioning routines scoped insert" on public.conditioning_routines;
drop policy if exists "Conditioning routines scoped update" on public.conditioning_routines;
drop policy if exists "Conditioning exercises scoped read" on public.conditioning_routine_exercises;
drop policy if exists "Conditioning exercises scoped manage" on public.conditioning_routine_exercises;

create policy "Conditioning routines scoped access"
  on public.conditioning_routines for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = conditioning_routines.club_id
    )
    or exists (
      select 1
      from public.performance_staff
      where performance_staff.id = conditioning_routines.staff_id
        and performance_staff.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = conditioning_routines.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Conditioning routines scoped insert"
  on public.conditioning_routines for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = conditioning_routines.club_id
    )
    or exists (
      select 1
      from public.performance_staff
      where performance_staff.id = conditioning_routines.staff_id
        and performance_staff.user_id = auth.uid()
    )
  );

create policy "Conditioning routines scoped update"
  on public.conditioning_routines for update
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = conditioning_routines.club_id
    )
    or exists (
      select 1
      from public.performance_staff
      where performance_staff.id = conditioning_routines.staff_id
        and performance_staff.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = conditioning_routines.club_id
    )
    or exists (
      select 1
      from public.performance_staff
      where performance_staff.id = conditioning_routines.staff_id
        and performance_staff.user_id = auth.uid()
    )
  );

create policy "Conditioning exercises scoped read"
  on public.conditioning_routine_exercises for select
  to authenticated
  using (
    exists (
      select 1
      from public.conditioning_routines
      where conditioning_routines.id = conditioning_routine_exercises.routine_id
    )
  );

create policy "Conditioning exercises scoped manage"
  on public.conditioning_routine_exercises for all
  to authenticated
  using (
    exists (
      select 1
      from public.conditioning_routines
      join public.users on users.id = auth.uid()
      where conditioning_routines.id = conditioning_routine_exercises.routine_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = conditioning_routines.club_id
          )
        )
    )
    or exists (
      select 1
      from public.conditioning_routines
      join public.performance_staff on performance_staff.id = conditioning_routines.staff_id
      where conditioning_routines.id = conditioning_routine_exercises.routine_id
        and performance_staff.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.conditioning_routines
      join public.users on users.id = auth.uid()
      where conditioning_routines.id = conditioning_routine_exercises.routine_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = conditioning_routines.club_id
          )
        )
    )
    or exists (
      select 1
      from public.conditioning_routines
      join public.performance_staff on performance_staff.id = conditioning_routines.staff_id
      where conditioning_routines.id = conditioning_routine_exercises.routine_id
        and performance_staff.user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
