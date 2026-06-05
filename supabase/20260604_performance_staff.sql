-- TAL performance staff.
-- Adds physical conditioning and sports psychology staff registries.

create table if not exists public.performance_staff (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
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

create index if not exists performance_staff_type_club_idx
  on public.performance_staff (staff_type, club_id, is_active);

create index if not exists athlete_performance_staff_assignments_athlete_idx
  on public.athlete_performance_staff_assignments (athlete_id, is_active);

create index if not exists conditioning_sessions_athlete_date_idx
  on public.conditioning_sessions (athlete_id, session_date desc);

create index if not exists psychology_sessions_athlete_date_idx
  on public.psychology_sessions (athlete_id, session_date desc);

alter table public.performance_staff enable row level security;
alter table public.athlete_performance_staff_assignments enable row level security;
alter table public.conditioning_sessions enable row level security;
alter table public.psychology_sessions enable row level security;

drop policy if exists "Admins and club coaches can read performance staff" on public.performance_staff;
drop policy if exists "Admins and club coaches can insert performance staff" on public.performance_staff;
drop policy if exists "Admins and club coaches can update performance staff" on public.performance_staff;

create policy "Admins and club coaches can read performance staff"
  on public.performance_staff for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = performance_staff.club_id
          )
        )
    )
  );

create policy "Admins and club coaches can insert performance staff"
  on public.performance_staff for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = performance_staff.club_id
          )
        )
    )
  );

create policy "Admins and club coaches can update performance staff"
  on public.performance_staff for update
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = performance_staff.club_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = performance_staff.club_id
          )
        )
    )
  );

drop policy if exists "Admins and club coaches can read staff assignments" on public.athlete_performance_staff_assignments;
drop policy if exists "Admins and club coaches can manage staff assignments" on public.athlete_performance_staff_assignments;

create policy "Admins and club coaches can read staff assignments"
  on public.athlete_performance_staff_assignments for select
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = athlete_performance_staff_assignments.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

create policy "Admins and club coaches can manage staff assignments"
  on public.athlete_performance_staff_assignments for all
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = athlete_performance_staff_assignments.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = athlete_performance_staff_assignments.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

drop policy if exists "Admins and club coaches can read conditioning sessions" on public.conditioning_sessions;
drop policy if exists "Admins and club coaches can manage conditioning sessions" on public.conditioning_sessions;
drop policy if exists "Admins and club coaches can read psychology sessions" on public.psychology_sessions;
drop policy if exists "Admins and club coaches can manage psychology sessions" on public.psychology_sessions;

create policy "Admins and club coaches can read conditioning sessions"
  on public.conditioning_sessions for select
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = conditioning_sessions.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

create policy "Admins and club coaches can manage conditioning sessions"
  on public.conditioning_sessions for all
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = conditioning_sessions.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = conditioning_sessions.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

create policy "Admins and club coaches can read psychology sessions"
  on public.psychology_sessions for select
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = psychology_sessions.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

create policy "Admins and club coaches can manage psychology sessions"
  on public.psychology_sessions for all
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = psychology_sessions.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = psychology_sessions.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

notify pgrst, 'reload schema';
