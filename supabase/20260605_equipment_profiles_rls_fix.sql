-- TAL equipment profiles RLS fix.
-- Run this full script in Supabase SQL Editor with "Run", not "Analyze".

alter table public.equipment_profiles enable row level security;

drop policy if exists "Equipment scoped read" on public.equipment_profiles;
drop policy if exists "Equipment scoped insert" on public.equipment_profiles;
drop policy if exists "Equipment scoped update" on public.equipment_profiles;

create policy "Equipment scoped read"
  on public.equipment_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = equipment_profiles.athlete_id
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

create policy "Equipment scoped insert"
  on public.equipment_profiles for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = equipment_profiles.athlete_id
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

create policy "Equipment scoped update"
  on public.equipment_profiles for update
  to authenticated
  using (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = equipment_profiles.athlete_id
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
  )
  with check (
    exists (
      select 1
      from public.athlete_profiles
      join public.users on users.id = auth.uid()
      where athlete_profiles.id = equipment_profiles.athlete_id
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

grant select, insert, update on public.equipment_profiles to authenticated;
notify pgrst, 'reload schema';
