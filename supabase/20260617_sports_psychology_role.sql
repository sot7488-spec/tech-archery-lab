-- TAL sports psychology role and performance mental training.
-- Focused on sport performance only, not clinical therapy.

alter type public.user_role add value if not exists 'sports_psychologist';

alter table public.staff_invitations
  drop constraint if exists staff_invitations_role_check;

alter table public.staff_invitations
  add constraint staff_invitations_role_check
  check (role in ('coach', 'admin', 'sports_psychologist'));

drop policy if exists "Staff invitations admin insert" on public.staff_invitations;

create policy "Staff invitations admin insert"
  on public.staff_invitations for insert
  to authenticated
  with check (
    invited_by = auth.uid()
    and role in ('coach', 'admin', 'sports_psychologist')
    and exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

alter table public.psychology_sessions
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists session_type text not null default 'sport_checkin'
    check (session_type in ('sport_checkin', 'technique_followup', 'competition_prep', 'post_competition')),
  add column if not exists sport_feeling text,
  add column if not exists pressure_score integer check (pressure_score between 1 and 5),
  add column if not exists breathing_control_score integer check (breathing_control_score between 1 and 5),
  add column if not exists routine_clarity_score integer check (routine_clarity_score between 1 and 5),
  add column if not exists error_recovery_score integer check (error_recovery_score between 1 and 5),
  add column if not exists recommendation text,
  add column if not exists technique_id uuid,
  add column if not exists updated_at timestamp with time zone not null default now();

create table if not exists public.mental_techniques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  instructions text not null,
  evidence_note text,
  duration_minutes integer check (duration_minutes between 1 and 60),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

alter table public.psychology_sessions
  drop constraint if exists psychology_sessions_technique_id_fkey;

alter table public.psychology_sessions
  add constraint psychology_sessions_technique_id_fkey
  foreign key (technique_id) references public.mental_techniques(id) on delete set null;

create table if not exists public.athlete_mental_technique_assignments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid references public.performance_staff(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  technique_id uuid not null references public.mental_techniques(id) on delete cascade,
  objective text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  assigned_by uuid references public.users(id),
  assigned_at timestamp with time zone not null default now(),
  unique (athlete_id, technique_id, status)
);

create table if not exists public.athlete_mental_routines (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid references public.performance_staff(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  breathing_step text,
  visualization_step text,
  cue_word text,
  reset_action text,
  competition_note text,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.athlete_mental_practice_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  assignment_id uuid references public.athlete_mental_technique_assignments(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  practiced_at date not null default current_date,
  usefulness_score integer check (usefulness_score between 1 and 5),
  worked_status text not null default 'practiced'
    check (worked_status in ('practiced', 'worked', 'not_worked')),
  sport_comment text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.athlete_mental_season_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  staff_id uuid references public.performance_staff(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  season_phase text not null default 'base'
    check (season_phase in ('base', 'preparation', 'competition', 'recovery')),
  start_date date not null default current_date,
  end_date date,
  objective text,
  focus_areas text,
  success_criteria text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_by uuid references public.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists psychology_sessions_club_date_idx
  on public.psychology_sessions (club_id, session_date desc);

create index if not exists psychology_sessions_staff_date_idx
  on public.psychology_sessions (staff_id, session_date desc);

create index if not exists athlete_mental_technique_assignments_athlete_idx
  on public.athlete_mental_technique_assignments (athlete_id, status);

create index if not exists athlete_mental_routines_athlete_idx
  on public.athlete_mental_routines (athlete_id, is_active);

create index if not exists athlete_mental_practice_logs_athlete_idx
  on public.athlete_mental_practice_logs (athlete_id, practiced_at desc);

create index if not exists athlete_mental_season_plans_athlete_idx
  on public.athlete_mental_season_plans (athlete_id, status, start_date desc);

insert into public.mental_techniques
  (name, category, description, instructions, evidence_note, duration_minutes)
values
  (
    'Respiracion cuadrada',
    'respiracion',
    'Tecnica basica para regular activacion antes de una serie o despues de una flecha mala.',
    'Inhala 4 segundos, sostén 4, exhala 4 y sostén 4. Repite de 3 a 5 ciclos antes de tirar.',
    'Usada en entrenamiento atencional y regulacion de activacion fisiologica.',
    4
  ),
  (
    'Respiracion diafragmatica',
    'respiracion',
    'Ayuda a bajar tension corporal y recuperar control del ritmo previo al tiro.',
    'Coloca atencion en abdomen y costillas bajas. Inhala por nariz, expande abdomen, exhala lento por boca.',
    'Base frecuente en intervenciones de relajacion y control de ansiedad competitiva.',
    5
  ),
  (
    'Reset post-error',
    'control atencional',
    'Rutina breve para cortar rumiacion despues de una flecha mala.',
    'Nombra el error tecnico en una frase, suelta respirando, define un cue y vuelve a la rutina pre-tiro.',
    'Estrategia conductual para reenfocar atencion en la siguiente ejecucion.',
    3
  ),
  (
    'Visualizacion del tiro',
    'imagineria',
    'Ensayo mental de la ejecucion tecnica deseada antes de competir o entrenar.',
    'Cierra ojos 30-60 segundos. Visualiza postura, anclaje, expansion, salida y follow-through.',
    'La imagineria motora se usa en deporte para reforzar patrones y confianza.',
    6
  ),
  (
    'Cue mental de ejecucion',
    'rutina',
    'Palabra o frase corta para dirigir la atencion a una accion tecnica concreta.',
    'Elige una palabra como "expande", "fluye" o "firme". Usala solo antes de soltar.',
    'Los cues atencionales reducen ruido cognitivo y simplifican la tarea.',
    2
  )
on conflict do nothing;

alter table public.mental_techniques enable row level security;
alter table public.psychology_sessions enable row level security;
alter table public.athlete_mental_technique_assignments enable row level security;
alter table public.athlete_mental_routines enable row level security;
alter table public.athlete_mental_practice_logs enable row level security;
alter table public.athlete_mental_season_plans enable row level security;

drop policy if exists "Mental techniques read" on public.mental_techniques;
drop policy if exists "Psychology sessions sport scoped read" on public.psychology_sessions;
drop policy if exists "Psychology sessions sport scoped insert" on public.psychology_sessions;
drop policy if exists "Mental assignments scoped read" on public.athlete_mental_technique_assignments;
drop policy if exists "Mental assignments scoped insert" on public.athlete_mental_technique_assignments;
drop policy if exists "Mental routines scoped read" on public.athlete_mental_routines;
drop policy if exists "Mental routines scoped insert" on public.athlete_mental_routines;
drop policy if exists "Mental practice logs scoped read" on public.athlete_mental_practice_logs;
drop policy if exists "Mental practice logs scoped insert" on public.athlete_mental_practice_logs;
drop policy if exists "Mental season plans scoped read" on public.athlete_mental_season_plans;
drop policy if exists "Mental season plans scoped insert" on public.athlete_mental_season_plans;

create policy "Mental techniques read"
  on public.mental_techniques for select
  to authenticated
  using (is_active = true);

create policy "Psychology sessions sport scoped read"
  on public.psychology_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = psychology_sessions.club_id
    )
    or exists (
      select 1
      from public.performance_staff
      where performance_staff.user_id = auth.uid()
        and performance_staff.staff_type = 'sports_psychologist'
        and (
          performance_staff.id = psychology_sessions.staff_id
          or performance_staff.club_id = psychology_sessions.club_id
        )
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = psychology_sessions.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Psychology sessions sport scoped insert"
  on public.psychology_sessions for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = psychology_sessions.athlete_id
        and athlete_profiles.club_id = psychology_sessions.club_id
    )
    and (
      exists (
        select 1 from public.users
        where users.id = auth.uid()
          and users.role::text = 'admin'
      )
      or exists (
        select 1 from public.users
        where users.id = auth.uid()
          and users.role::text = 'coach'
          and users.club_id = psychology_sessions.club_id
      )
      or exists (
        select 1
        from public.performance_staff
        where performance_staff.user_id = auth.uid()
          and performance_staff.staff_type = 'sports_psychologist'
          and performance_staff.club_id = psychology_sessions.club_id
      )
    )
  );

create policy "Mental assignments scoped read"
  on public.athlete_mental_technique_assignments for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = athlete_mental_technique_assignments.club_id
    )
    or exists (
      select 1
      from public.performance_staff
      where performance_staff.user_id = auth.uid()
        and performance_staff.staff_type = 'sports_psychologist'
        and performance_staff.club_id = athlete_mental_technique_assignments.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_technique_assignments.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Mental assignments scoped insert"
  on public.athlete_mental_technique_assignments for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_technique_assignments.athlete_id
        and athlete_profiles.club_id = athlete_mental_technique_assignments.club_id
    )
    and (
      exists (
        select 1 from public.users
        where users.id = auth.uid()
          and users.role::text = 'admin'
      )
      or exists (
        select 1 from public.users
        where users.id = auth.uid()
          and users.role::text = 'coach'
          and users.club_id = athlete_mental_technique_assignments.club_id
      )
      or exists (
        select 1
        from public.performance_staff
        where performance_staff.user_id = auth.uid()
          and performance_staff.staff_type = 'sports_psychologist'
          and performance_staff.club_id = athlete_mental_technique_assignments.club_id
      )
    )
  );

create policy "Mental routines scoped read"
  on public.athlete_mental_routines for select
  to authenticated
  using (
    exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'admin')
    or exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'coach' and users.club_id = athlete_mental_routines.club_id)
    or exists (
      select 1 from public.performance_staff
      where performance_staff.user_id = auth.uid()
        and performance_staff.staff_type = 'sports_psychologist'
        and performance_staff.club_id = athlete_mental_routines.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_routines.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Mental routines scoped insert"
  on public.athlete_mental_routines for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_routines.athlete_id
        and athlete_profiles.club_id = athlete_mental_routines.club_id
    )
    and (
      exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'admin')
      or exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'coach' and users.club_id = athlete_mental_routines.club_id)
      or exists (
        select 1 from public.performance_staff
        where performance_staff.user_id = auth.uid()
          and performance_staff.staff_type = 'sports_psychologist'
          and performance_staff.club_id = athlete_mental_routines.club_id
      )
    )
  );

create policy "Mental practice logs scoped read"
  on public.athlete_mental_practice_logs for select
  to authenticated
  using (
    exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'admin')
    or exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'coach' and users.club_id = athlete_mental_practice_logs.club_id)
    or exists (
      select 1 from public.performance_staff
      where performance_staff.user_id = auth.uid()
        and performance_staff.staff_type = 'sports_psychologist'
        and performance_staff.club_id = athlete_mental_practice_logs.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_practice_logs.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Mental practice logs scoped insert"
  on public.athlete_mental_practice_logs for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_practice_logs.athlete_id
        and athlete_profiles.club_id = athlete_mental_practice_logs.club_id
    )
    and (
      exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'admin')
      or exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'coach' and users.club_id = athlete_mental_practice_logs.club_id)
      or exists (
        select 1 from public.performance_staff
        where performance_staff.user_id = auth.uid()
          and performance_staff.staff_type = 'sports_psychologist'
          and performance_staff.club_id = athlete_mental_practice_logs.club_id
      )
      or exists (
        select 1 from public.athlete_profiles
        where athlete_profiles.id = athlete_mental_practice_logs.athlete_id
          and athlete_profiles.user_id = auth.uid()
      )
    )
  );

create policy "Mental season plans scoped read"
  on public.athlete_mental_season_plans for select
  to authenticated
  using (
    exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'admin')
    or exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'coach' and users.club_id = athlete_mental_season_plans.club_id)
    or exists (
      select 1 from public.performance_staff
      where performance_staff.user_id = auth.uid()
        and performance_staff.staff_type = 'sports_psychologist'
        and performance_staff.club_id = athlete_mental_season_plans.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_season_plans.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Mental season plans scoped insert"
  on public.athlete_mental_season_plans for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = athlete_mental_season_plans.athlete_id
        and athlete_profiles.club_id = athlete_mental_season_plans.club_id
    )
    and (
      exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'admin')
      or exists (select 1 from public.users where users.id = auth.uid() and users.role::text = 'coach' and users.club_id = athlete_mental_season_plans.club_id)
      or exists (
        select 1 from public.performance_staff
        where performance_staff.user_id = auth.uid()
          and performance_staff.staff_type = 'sports_psychologist'
          and performance_staff.club_id = athlete_mental_season_plans.club_id
      )
    )
  );

grant select on public.mental_techniques to authenticated;
grant select, insert on public.psychology_sessions to authenticated;
grant select, insert on public.athlete_mental_technique_assignments to authenticated;
grant select, insert on public.athlete_mental_routines to authenticated;
grant select, insert on public.athlete_mental_practice_logs to authenticated;
grant select, insert on public.athlete_mental_season_plans to authenticated;

drop policy if exists "Sports psychologist self staff insert" on public.performance_staff;

create policy "Sports psychologist self staff insert"
  on public.performance_staff for insert
  to authenticated
  with check (
    staff_type = 'sports_psychologist'
    and user_id = auth.uid()
    and exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'sports_psychologist'
        and users.club_id = performance_staff.club_id
    )
  );

grant insert on public.performance_staff to authenticated;

notify pgrst, 'reload schema';
