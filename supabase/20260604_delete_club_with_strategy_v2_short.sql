-- TAL safe club deletion, short version.
-- IMPORTANT:
-- Run the whole file with Run.
-- Do not use Analyze/EXPLAIN.
-- If Supabase suggests adding RLS statements to this script, do not accept.

create or replace function public.delete_club_with_strategy(
  p_club_id uuid,
  p_strategy text,
  p_target_club_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $tal_delete_club$
begin
  if not exists (
    select 1 from public.users
    where id = auth.uid()
      and role::text = 'admin'
  ) then
    raise exception 'Solo admin puede eliminar clubs.';
  end if;

  if p_strategy not in ('delete_athletes', 'migrate_athletes') then
    raise exception 'Estrategia no valida.';
  end if;

  if not exists (select 1 from public.clubs where id = p_club_id) then
    raise exception 'Club no encontrado.';
  end if;

  if p_strategy = 'migrate_athletes' then
    if p_target_club_id is null or p_target_club_id = p_club_id then
      raise exception 'Selecciona un club destino diferente.';
    end if;

    if not exists (select 1 from public.clubs where id = p_target_club_id) then
      raise exception 'Club destino no encontrado.';
    end if;

    update public.athlete_profiles
    set club_id = p_target_club_id,
        updated_at = now()
    where club_id = p_club_id;

    update public.users
    set club_id = p_target_club_id,
        updated_at = now()
    where id in (
      select user_id from public.athlete_profiles
      where club_id = p_target_club_id
    );

    update public.training_sessions
    set club_id = p_target_club_id,
        updated_at = now()
    where club_id = p_club_id;

    update public.indoor_league_athletes
    set club_id = p_target_club_id
    where club_id = p_club_id;

    update public.indoor_league_results
    set club_id = p_target_club_id
    where club_id = p_club_id;

    update public.conditioning_routines
    set club_id = p_target_club_id,
        updated_at = now()
    where club_id = p_club_id;
  else
    delete from public.indoor_league_result_arrows
    where result_id in (
      select id from public.indoor_league_results
      where club_id = p_club_id
         or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
    );

    delete from public.indoor_league_results
    where club_id = p_club_id
       or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.indoor_league_athletes
    where club_id = p_club_id
       or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.conditioning_routine_exercises
    where routine_id in (
      select id from public.conditioning_routines
      where club_id = p_club_id
         or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
    );

    delete from public.conditioning_routines
    where club_id = p_club_id
       or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.conditioning_sessions
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.psychology_sessions
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.athlete_performance_staff_assignments
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.athlete_skill_evaluations
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.athlete_goals
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.athlete_parents
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
       or parent_user_id in (select user_id from public.athlete_profiles where club_id = p_club_id);

    delete from public.equipment_tuning_logs
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
       or equipment_profile_id in (
         select id from public.equipment_profiles
         where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
       );

    delete from public.equipment_profiles
    where athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from public.arrows
    where series_id in (
      select series.id
      from public.series
      join public.training_rounds on training_rounds.id = series.training_round_id
      join public.training_sessions on training_sessions.id = training_rounds.training_session_id
      where training_sessions.club_id = p_club_id
         or training_sessions.athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
    );

    delete from public.series
    where training_round_id in (
      select training_rounds.id
      from public.training_rounds
      join public.training_sessions on training_sessions.id = training_rounds.training_session_id
      where training_sessions.club_id = p_club_id
         or training_sessions.athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
    );

    delete from public.training_rounds
    where training_session_id in (
      select id from public.training_sessions
      where club_id = p_club_id
         or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id)
    );

    delete from public.training_sessions
    where club_id = p_club_id
       or athlete_id in (select id from public.athlete_profiles where club_id = p_club_id);

    delete from auth.users
    where id in (select user_id from public.athlete_profiles where club_id = p_club_id);

    delete from public.users
    where id in (select user_id from public.athlete_profiles where club_id = p_club_id);

    delete from public.athlete_profiles
    where club_id = p_club_id;
  end if;

  delete from public.staff_invitations where club_id = p_club_id;
  delete from public.athlete_performance_staff_assignments
  where staff_id in (select id from public.performance_staff where club_id = p_club_id);

  update public.conditioning_routines
  set staff_id = null,
      updated_at = now()
  where staff_id in (select id from public.performance_staff where club_id = p_club_id);

  update public.conditioning_sessions
  set staff_id = null
  where staff_id in (select id from public.performance_staff where club_id = p_club_id);

  update public.psychology_sessions
  set staff_id = null
  where staff_id in (select id from public.performance_staff where club_id = p_club_id);

  delete from public.performance_staff where club_id = p_club_id;
  delete from public.coach_profiles where club_id = p_club_id;

  update public.users
  set club_id = null,
      is_active = false,
      updated_at = now()
  where club_id = p_club_id;

  delete from public.indoor_league_clubs where club_id = p_club_id;
  delete from public.clubs where id = p_club_id;
end;
$tal_delete_club$;

grant execute on function public.delete_club_with_strategy(uuid, text, uuid) to authenticated;
notify pgrst, 'reload schema';
