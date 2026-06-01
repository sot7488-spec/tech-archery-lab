create or replace function public.enroll_indoor_league_athletes(
  p_league_id uuid,
  p_athlete_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_club_id uuid;
begin
  select users.role::text, users.club_id
  into v_role, v_club_id
  from public.users
  where users.id = v_user_id;

  if v_role is null then
    raise exception 'Usuario no encontrado.';
  end if;

  if p_league_id is null or p_athlete_ids is null or array_length(p_athlete_ids, 1) is null then
    raise exception 'Selecciona atletas para inscribir.';
  end if;

  if v_role = 'coach' then
    if v_club_id is null then
      raise exception 'Tu perfil de coach no tiene club asignado.';
    end if;

    if not exists (
      select 1
      from public.indoor_league_coaches
      where league_id = p_league_id
        and coach_id = v_user_id
    ) then
      raise exception 'No fuiste invitado a esta liga.';
    end if;

    insert into public.indoor_league_athletes (league_id, athlete_id, club_id, enrolled_by)
    select p_league_id, athlete_profiles.id, athlete_profiles.club_id, v_user_id
    from public.athlete_profiles
    where athlete_profiles.id = any(p_athlete_ids)
      and athlete_profiles.club_id = v_club_id
    on conflict (league_id, athlete_id) do nothing;

    return;
  end if;

  if v_role = 'admin' then
    insert into public.indoor_league_athletes (league_id, athlete_id, club_id, enrolled_by)
    select p_league_id, athlete_profiles.id, athlete_profiles.club_id, v_user_id
    from public.athlete_profiles
    where athlete_profiles.id = any(p_athlete_ids)
    on conflict (league_id, athlete_id) do nothing;

    return;
  end if;

  raise exception 'No tienes permiso para inscribir atletas.';
end;
$$;

grant execute on function public.enroll_indoor_league_athletes(uuid, uuid[]) to authenticated;

notify pgrst, 'reload schema';
