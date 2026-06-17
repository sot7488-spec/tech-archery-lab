-- TAL Video Analysis V3.
-- Separate table for the biomechanical MediaPipe Heavy module.

create table if not exists public.video_analysis_v3 (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  coach_id uuid references public.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  camera_view text not null check (camera_view in ('lateral', 'frontal', 'superior')),
  anchor_time_seconds numeric not null default 0,
  phase text not null default 'anchor',
  score integer not null default 0 check (score between 0 and 100),
  metrics jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  frames_analyzed integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists video_analysis_v3_athlete_created_idx
  on public.video_analysis_v3 (athlete_id, created_at desc);

create index if not exists video_analysis_v3_club_created_idx
  on public.video_analysis_v3 (club_id, created_at desc);

alter table public.video_analysis_v3 enable row level security;

drop policy if exists "Video analysis V3 scoped read" on public.video_analysis_v3;
drop policy if exists "Video analysis V3 scoped insert" on public.video_analysis_v3;

create policy "Video analysis V3 scoped read"
  on public.video_analysis_v3 for select
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
        and users.club_id = video_analysis_v3.club_id
    )
    or exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = video_analysis_v3.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Video analysis V3 scoped insert"
  on public.video_analysis_v3 for insert
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
        and users.club_id = video_analysis_v3.club_id
    )
    or exists (
      select 1
      from public.athlete_profiles
      where athlete_profiles.id = video_analysis_v3.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

grant select, insert on public.video_analysis_v3 to authenticated;

notify pgrst, 'reload schema';
