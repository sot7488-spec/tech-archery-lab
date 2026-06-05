-- Safe cleanup for TAL using auth.users as the source of truth.
-- Keeps only auth.users.email = sot7488@gmail.com and recreates/repairs
-- its public.users profile as admin.
--
-- Run this whole file as one SQL query in Supabase SQL Editor.

begin;

create temporary table tal_cleanup_keep_admin as
select id, email
from auth.users
where lower(trim(email)) = lower(trim('sot7488@gmail.com'));

-- Safety check: exactly one auth user with this email must exist.
select
  case
    when (select count(*) from tal_cleanup_keep_admin) = 1 then 1
    else 1 / 0
  end as safety_check_auth_admin_exists;

-- Show the account that will be preserved.
select id, email
from tal_cleanup_keep_admin;

-- Remove all dependent application data first.
delete from public.indoor_league_result_arrows;
delete from public.indoor_league_results;
delete from public.indoor_league_athletes;
delete from public.indoor_league_coaches;
delete from public.indoor_league_clubs;
delete from public.indoor_league_rounds;
delete from public.indoor_leagues;

delete from public.arrows;
delete from public.series;
delete from public.training_rounds;
delete from public.training_sessions;

delete from public.equipment_tuning_logs;
delete from public.equipment_profiles;
delete from public.athlete_skill_evaluations;
delete from public.athlete_goals;
delete from public.athlete_parents;
delete from public.athlete_profiles;

delete from public.staff_invitations;
delete from public.coach_profiles;

delete from public.conade_marks;
delete from public.skills;
delete from public.clubs;

-- Remove all public users except the preserved auth account if it exists there.
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

-- Remove all auth users except the preserved account.
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
