-- TAL video analysis feedback.
-- Stores coach feedback snapshots generated from /video-analysis.

create table if not exists public.video_analysis_feedback (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  coach_id uuid references public.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  title text not null default 'Analisis tecnico',
  feedback text not null,
  snapshot_data_url text not null,
  video_time_seconds numeric,
  analysis_mode text check (analysis_mode in ('lateral', 'front_t')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists video_analysis_feedback_athlete_created_idx
  on public.video_analysis_feedback (athlete_id, created_at desc);

create index if not exists video_analysis_feedback_club_idx
  on public.video_analysis_feedback (club_id, created_at desc);

alter table public.video_analysis_feedback enable row level security;

drop policy if exists "Video feedback scoped read" on public.video_analysis_feedback;
drop policy if exists "Video feedback coach admin insert" on public.video_analysis_feedback;

create policy "Video feedback scoped read"
  on public.video_analysis_feedback for select
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = video_analysis_feedback.athlete_id
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
          or (
            users.role::text = 'athlete'
            and athlete_profiles.user_id = users.id
          )
        )
    )
  );

create policy "Video feedback coach admin insert"
  on public.video_analysis_feedback for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = video_analysis_feedback.athlete_id
        and video_analysis_feedback.coach_id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = athlete_profiles.club_id
          )
        )
    )
  );

grant select, insert on public.video_analysis_feedback to authenticated;
notify pgrst, 'reload schema';
