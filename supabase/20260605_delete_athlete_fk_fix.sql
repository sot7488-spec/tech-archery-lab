-- TAL athlete deletion FK fix.
-- Run this in Supabase SQL Editor with "Run", not "Analyze".
-- It replaces only the delete function and keeps the existing UI/RPC action.

create or replace function public.delete_athlete_account(
  p_athlete_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $tal_delete_athlete$
declare
  v_actor_id uuid := auth.uid();
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
    select 1 from public.users
    where id = v_actor_id
      and (
        role::text = 'admin'
        or (role::text = 'coach' and club_id = v_current_club_id)
      )
  ) then
    raise exception 'No tienes permiso para eliminar este atleta.';
  end if;

  -- Reassign cross-record authorship before deleting the user's row.
  update public.indoor_leagues
  set created_by = v_actor_id
  where created_by = v_user_id;

  update public.indoor_league_clubs
  set joined_by = v_actor_id
  where joined_by = v_user_id;

  update public.indoor_league_coaches
  set invited_by = v_actor_id
  where invited_by = v_user_id;

  update public.indoor_league_results
  set submitted_by = v_actor_id
  where submitted_by = v_user_id
    and athlete_id <> p_athlete_id;

  update public.indoor_league_results
  set validated_by = null
  where validated_by = v_user_id;

  update public.staff_invitations
  set invited_by = v_actor_id,
      updated_at = now()
  where invited_by = v_user_id;

  update public.performance_staff
  set created_by = v_actor_id
  where created_by = v_user_id;

  update public.athlete_performance_staff_assignments
  set assigned_by = v_actor_id
  where assigned_by = v_user_id
    and athlete_id <> p_athlete_id;

  update public.conditioning_routines
  set created_by = v_actor_id,
      updated_at = now()
  where created_by = v_user_id
    and athlete_id <> p_athlete_id;

  update public.conditioning_sessions
  set created_by = v_actor_id
  where created_by = v_user_id
    and athlete_id <> p_athlete_id;

  update public.psychology_sessions
  set created_by = v_actor_id
  where created_by = v_user_id
    and athlete_id <> p_athlete_id;

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

  delete from public.users
  where id = v_user_id;

  delete from auth.users
  where id = v_user_id;
end;
$tal_delete_athlete$;

grant execute on function public.delete_athlete_account(uuid) to authenticated;
notify pgrst, 'reload schema';
