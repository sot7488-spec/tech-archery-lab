-- TAL performance staff minimal schema.
-- Run this first if the full RLS script gives a paste/editor error.

create table if not exists public.performance_staff (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  staff_type text not null check (staff_type in ('physical_trainer', 'sports_psychologist')),
  name text not null,
  email text,
  phone text,
  specialty text,
  certification_level text,
  certification_institution text,
  years_experience integer not null default 0 check (years_experience >= 0),
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists performance_staff_user_id_key
  on public.performance_staff (user_id)
  where user_id is not null;

create index if not exists performance_staff_type_club_idx
  on public.performance_staff (staff_type, club_id, is_active);

create table if not exists public.athlete_performance_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid not null references public.performance_staff(id) on delete cascade,
  assigned_by uuid references public.users(id),
  assigned_at timestamp with time zone not null default now(),
  notes text,
  is_active boolean not null default true,
  unique (athlete_id, staff_id)
);

create table if not exists public.conditioning_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid references public.performance_staff(id) on delete set null,
  session_date date not null default current_date,
  focus_area text,
  workload text,
  mobility_score integer check (mobility_score between 1 and 5),
  strength_score integer check (strength_score between 1 and 5),
  endurance_score integer check (endurance_score between 1 and 5),
  notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.psychology_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid references public.performance_staff(id) on delete set null,
  session_date date not null default current_date,
  focus_area text,
  confidence_score integer check (confidence_score between 1 and 5),
  focus_score integer check (focus_score between 1 and 5),
  stress_score integer check (stress_score between 1 and 5),
  notes text,
  private_notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now()
);

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

create index if not exists athlete_performance_staff_assignments_athlete_idx
  on public.athlete_performance_staff_assignments (athlete_id, is_active);

create index if not exists conditioning_sessions_athlete_date_idx
  on public.conditioning_sessions (athlete_id, session_date desc);

create index if not exists psychology_sessions_athlete_date_idx
  on public.psychology_sessions (athlete_id, session_date desc);

create index if not exists conditioning_routines_athlete_status_idx
  on public.conditioning_routines (athlete_id, status, start_date desc);

create index if not exists conditioning_routines_staff_idx
  on public.conditioning_routines (staff_id, start_date desc);

create index if not exists conditioning_routine_exercises_routine_idx
  on public.conditioning_routine_exercises (routine_id, exercise_order);

notify pgrst, 'reload schema';
