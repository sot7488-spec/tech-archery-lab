-- Safe cleanup for TAL using the known admin auth user id.
-- Keeps only:
--   id:    70aaeefe-e560-494f-9a31-5530b0e5d1d8
--   email: sot7488@gmail.com
--
-- IMPORTANT:
-- Run with the normal "Run" button in Supabase SQL Editor.
-- Do not use "Analyze" / "EXPLAIN".

begin;

create temporary table tal_cleanup_keep_admin (
  id uuid primary key,
  email text not null
);

insert into tal_cleanup_keep_admin (id, email)
select id, email
from auth.users
where id = '70aaeefe-e560-494f-9a31-5530b0e5d1d8'::uuid
  and lower(trim(email)) = lower(trim('sot7488@gmail.com'));

-- If this returns 0 rows, stop and do not continue with the cleanup.
select
  'ADMIN_TO_KEEP' as check_name,
  id,
  email
from tal_cleanup_keep_admin;

-- The next statement intentionally blocks the cleanup if the admin was not found.
-- It uses a real PostgreSQL assertion through a CHECKed temp table instead of DO $$.
create temporary table tal_cleanup_guard (
  ok integer not null check (ok = 1)
);

insert into tal_cleanup_guard (ok)
select count(*)::integer
from tal_cleanup_keep_admin;

-- League data.
delete from public.indoor_league_result_arrows;
delete from public.indoor_league_results;
delete from public.indoor_league_athletes;
delete from public.indoor_league_coaches;
delete from public.indoor_league_clubs;
delete from public.indoor_league_rounds;
delete from public.indoor_leagues;

-- Training score data.
delete from public.arrows;
delete from public.series;
delete from public.training_rounds;
delete from public.training_sessions;

-- Athlete and equipment data.
delete from public.equipment_tuning_logs;
delete from public.equipment_profiles;
delete from public.athlete_skill_evaluations;
delete from public.athlete_goals;
delete from public.athlete_parents;
delete from public.athlete_profiles;

-- Staff and coach data.
delete from public.staff_invitations;
delete from public.coach_profiles;

-- Catalog and organization data.
delete from public.conade_marks;
delete from public.skills;
delete from public.clubs;

-- Remove all public users except the preserved admin if present.
delete from public.users
where id <> (select id from tal_cleanup_keep_admin);

-- Repair or create the preserved public admin profile.
insert into public.users (
  id,
  club_id,
  name,
  email,
  role,
  is_active,
  created_at,
  updated_at
)
select
  id,
  null,
  'Administrador TAL',
  email,
  'admin'::user_role,
  true,
  now(),
  now()
from tal_cleanup_keep_admin
on conflict (id) do update
set club_id = null,
    name = coalesce(nullif(public.users.name, ''), 'Administrador TAL'),
    email = excluded.email,
    role = 'admin'::user_role,
    is_active = true,
    updated_at = now();

-- Remove all auth users except the preserved admin.
delete from auth.users
where id <> (select id from tal_cleanup_keep_admin);

commit;

-- Post-check.
select id, email, role, club_id, is_active
from public.users
order by created_at;

select id, email, created_at
from auth.users
order by created_at;
