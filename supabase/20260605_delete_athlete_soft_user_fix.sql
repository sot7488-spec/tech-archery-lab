-- TAL athlete deletion soft-user fix.
-- Run this full script in Supabase SQL Editor with "Run", not "Analyze".
--
-- Why this version exists:
-- Some historical records can reference public.users through audit fields such as
-- indoor_leagues.created_by. Instead of fighting every possible audit FK, this
-- removes the athlete profile and sport data, then anonymizes/deactivates the
-- public user so foreign-key history remains valid.

create or replace function public.delete_athlete_account(
  p_athlete_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $tal_delete_athlete_soft_user$
declare
  v_current_club_id uuid;
  v_user_id uuid;
begin
  select club_id, user_id
  into v_current_club_id, v_user_id
  from public.athlete_profiles
  where id = p_athlete_id;

  if v_user_id is null then
    raise exception 'Atleta no encontrado.';
  end if;

  if not exists (
    select 1
    from public.users
    where id = auth.uid()
      and (
        role::text = 'admin'
        or (role::text = 'coach' and club_id = v_current_club_id)
      )
  ) then
    raise exception 'No tienes permiso para eliminar este atleta.';
  end if;

  delete from public.indoor_league_result_arrows
  where result_id in (
    select id
    from public.indoor_league_results
    where athlete_id = p_athlete_id
  );

  delete from public.indoor_league_results
  where athlete_id = p_athlete_id;

  delete from public.indoor_league_athletes
  where athlete_id = p_athlete_id;

  delete from public.conditioning_routine_exercises
  where routine_id in (
    select id
    from public.conditioning_routines
    where athlete_id = p_athlete_id
  );

  delete from public.conditioning_routines
  where athlete_id = p_athlete_id;

  delete from public.conditioning_sessions
  where athlete_id = p_athlete_id;

  delete from public.psychology_sessions
  where athlete_id = p_athlete_id;

  delete from public.athlete_performance_staff_assignments
  where athlete_id = p_athlete_id;

  delete from public.athlete_skill_evaluations
  where athlete_id = p_athlete_id;

  delete from public.athlete_goals
  where athlete_id = p_athlete_id;

  delete from public.athlete_parents
  where athlete_id = p_athlete_id
     or parent_user_id = v_user_id;

  delete from public.equipment_tuning_logs
  where athlete_id = p_athlete_id
     or equipment_profile_id in (
       select id
       from public.equipment_profiles
       where athlete_id = p_athlete_id
     );

  delete from public.equipment_profiles
  where athlete_id = p_athlete_id;

  delete from public.arrows
  where series_id in (
    select series.id
    from public.series
    join public.training_rounds
      on training_rounds.id = series.training_round_id
    join public.training_sessions
      on training_sessions.id = training_rounds.training_session_id
    where training_sessions.athlete_id = p_athlete_id
  );

  delete from public.series
  where training_round_id in (
    select training_rounds.id
    from public.training_rounds
    join public.training_sessions
      on training_sessions.id = training_rounds.training_session_id
    where training_sessions.athlete_id = p_athlete_id
  );

  delete from public.training_rounds
  where training_session_id in (
    select id
    from public.training_sessions
    where athlete_id = p_athlete_id
  );

  delete from public.training_sessions
  where athlete_id = p_athlete_id;

  delete from public.athlete_profiles
  where id = p_athlete_id;

  update public.users
  set club_id = null,
      name = 'Atleta eliminado',
      email = concat('deleted+', replace(v_user_id::text, '-', ''), '@tal.local'),
      phone = null,
      profile_photo_url = null,
      is_active = false,
      updated_at = now()
  where id = v_user_id;
end;
$tal_delete_athlete_soft_user$;

grant execute on function public.delete_athlete_account(uuid) to authenticated;
notify pgrst, 'reload schema';
