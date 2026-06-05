-- Safe cleanup for TAL.
-- Goal: remove application data and keep only the admin account sot7488@gmail.com.
--
-- IMPORTANT:
-- 1) Run the PREVIEW section first.
-- 2) Review the counts.
-- 3) Run the CLEANUP section only when you are sure.
--
-- This script deletes clubs, athletes, coaches, trainings, equipment, leagues,
-- invitations, goals, skills, conade marks, and every public/auth user except
-- sot7488@gmail.com.

-- ============================================================
-- PREVIEW: run this section first
-- ============================================================

select
  id as admin_id,
  email,
  role,
  club_id,
  is_active,
  created_at
from public.users
where lower(email) = lower('sot7488@gmail.com');

select 'public.users_to_delete' as item, count(*) as rows
from public.users
where lower(email) <> lower('sot7488@gmail.com')
union all
select 'auth.users_to_delete', count(*)
from auth.users
where lower(email) <> lower('sot7488@gmail.com')
union all
select 'clubs', count(*) from public.clubs
union all
select 'athlete_profiles', count(*) from public.athlete_profiles
union all
select 'coach_profiles', count(*) from public.coach_profiles
union all
select 'training_sessions', count(*) from public.training_sessions
union all
select 'equipment_profiles', count(*) from public.equipment_profiles
union all
select 'indoor_leagues', count(*) from public.indoor_leagues
union all
select 'staff_invitations', count(*) from public.staff_invitations;

-- ============================================================
-- CLEANUP: run this section only after reviewing the preview
-- ============================================================

begin;

do $$
declare
  v_admin_id uuid;
  v_admin_count integer;
begin
  select count(*)
  into v_admin_count
  from public.users
  where lower(email) = lower('sot7488@gmail.com')
    and role::text = 'admin';

  if v_admin_count <> 1 then
    raise exception 'Cleanup stopped: expected exactly 1 admin user with email sot7488@gmail.com, found %.', v_admin_count;
  end if;

  select id
  into v_admin_id
  from public.users
  where lower(email) = lower('sot7488@gmail.com')
    and role::text = 'admin';

  -- Detach the preserved admin from any club before deleting clubs.
  update public.users
  set club_id = null,
      is_active = true,
      updated_at = now()
  where id = v_admin_id;

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

  -- Catalog and organization data. This follows the request to keep only the admin user.
  delete from public.conade_marks;
  delete from public.skills;
  delete from public.clubs;

  -- Delete app users except the preserved admin.
  delete from public.users
  where id <> v_admin_id;

  -- Delete auth users except the preserved admin. Supabase auth dependencies
  -- normally cascade from auth.users.
  delete from auth.users
  where id <> v_admin_id;
end $$;

commit;

-- Post-check.
select id, email, role, club_id, is_active
from public.users
order by created_at;
