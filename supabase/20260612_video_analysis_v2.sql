-- TAL Video Analysis V2.
-- Stores assisted technical video analysis records.

create table if not exists public.video_analysis (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  coach_id uuid references public.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  video_url text,
  view_type text not null check (view_type in ('frontal', 'lateral', 'superior')),
  score integer not null default 0 check (score between 0 and 100),
  metrics jsonb not null default '[]'::jsonb,
  observations jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists video_analysis_athlete_created_idx
  on public.video_analysis (athlete_id, created_at desc);

create index if not exists video_analysis_club_created_idx
  on public.video_analysis (club_id, created_at desc);

alter table public.video_analysis enable row level security;

drop policy if exists "Video analysis scoped read" on public.video_analysis;
drop policy if exists "Video analysis scoped insert" on public.video_analysis;

create policy "Video analysis scoped read"
  on public.video_analysis for select
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = video_analysis.athlete_id
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

create policy "Video analysis scoped insert"
  on public.video_analysis for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = video_analysis.athlete_id
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

grant select, insert on public.video_analysis to authenticated;
notify pgrst, 'reload schema';
