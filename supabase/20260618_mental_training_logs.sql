-- TAL weekly mental log for scheduled trainings.

create table if not exists public.mental_training_logs (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  log_date date not null default current_date,
  emotion_key text not null,
  emotion_intensity integer not null default 3 check (emotion_intensity between 1 and 5),
  body_key text not null,
  body_intensity integer not null default 3 check (body_intensity between 1 and 5),
  process_focus_score integer not null default 3 check (process_focus_score between 1 and 5),
  emotional_control_score integer not null default 3 check (emotional_control_score between 1 and 5),
  error_recovery_score integer not null default 3 check (error_recovery_score between 1 and 5),
  mental_score integer not null default 0 check (mental_score between 0 and 100),
  profile_label text not null default 'Funcional',
  sport_note text,
  cue_word text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (training_session_id, athlete_id)
);

create index if not exists mental_training_logs_athlete_date_idx
  on public.mental_training_logs (athlete_id, log_date desc);

create index if not exists mental_training_logs_club_date_idx
  on public.mental_training_logs (club_id, log_date desc);

alter table public.mental_training_logs enable row level security;

drop policy if exists "Mental logs scoped read" on public.mental_training_logs;
drop policy if exists "Mental logs scoped insert" on public.mental_training_logs;
drop policy if exists "Mental logs scoped update" on public.mental_training_logs;

create policy "Mental logs scoped read"
  on public.mental_training_logs for select
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
        and users.role::text in ('coach', 'sports_psychologist')
        and users.club_id = mental_training_logs.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = mental_training_logs.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Mental logs scoped insert"
  on public.mental_training_logs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text in ('coach', 'sports_psychologist')
        and users.club_id = mental_training_logs.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = mental_training_logs.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Mental logs scoped update"
  on public.mental_training_logs for update
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
        and users.role::text in ('coach', 'sports_psychologist')
        and users.club_id = mental_training_logs.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = mental_training_logs.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text in ('coach', 'sports_psychologist')
        and users.club_id = mental_training_logs.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = mental_training_logs.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );
