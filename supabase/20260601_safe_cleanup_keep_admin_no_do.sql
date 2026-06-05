-- Safe cleanup for TAL without DO $$ blocks.
-- Keeps only the admin user sot7488@gmail.com.
--
-- Run this whole file as one SQL query in Supabase SQL Editor.
-- It uses a transaction and safety checks before deleting anything.

begin;

create temporary table tal_cleanup_keep_admin as
select users.id
from public.users
join auth.users as auth_users on auth_users.id = users.id
where lower(users.email) = lower('sot7488@gmail.com')
  and lower(auth_users.email) = lower('sot7488@gmail.com')
  and users.role::text = 'admin';

-- Safety check 1: exactly one matching admin must exist in public.users + auth.users.
select
  case
    when (select count(*) from tal_cleanup_keep_admin) = 1 then 1
    else 1 / 0
  end as safety_check_admin_exists;

-- Safety check 2: show which account will be preserved.
select users.id, users.email, users.role
from public.users
join tal_cleanup_keep_admin on tal_cleanup_keep_admin.id = users.id;

-- Detach the preserved admin from any club before deleting clubs.
update public.users
set club_id = null,
    is_active = true,
    updated_at = now()
where id = (select id from tal_cleanup_keep_admin);

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

-- Delete app users except the preserved admin.
delete from public.users
where id <> (select id from tal_cleanup_keep_admin);

-- Delete auth users except the preserved admin.
delete from auth.users
where id <> (select id from tal_cleanup_keep_admin);

commit;

-- Post-check.
select id, email, role, club_id, is_active
from public.users
order by created_at;
