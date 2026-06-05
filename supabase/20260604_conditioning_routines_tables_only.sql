-- TAL conditioning routines tables only.
-- Run this first. It avoids long RLS policy blocks.

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

notify pgrst, 'reload schema';
