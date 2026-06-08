-- TAL delete training session.
-- Run this full script in Supabase SQL Editor with "Run", not "Analyze".

create or replace function public.delete_training_session(
  p_training_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $tal_delete_training$
declare
  v_club_id uuid;
  v_training_exists boolean;
begin
  select true, club_id
  into v_training_exists, v_club_id
  from public.training_sessions
  where id = p_training_id;

  if v_training_exists is not true then
    raise exception 'Entrenamiento no encontrado.';
  end if;

  if not exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and (
        users.role::text = 'admin'
        or (
          users.role::text = 'coach'
          and v_club_id is not null
          and users.club_id = v_club_id
        )
      )
  ) then
    raise exception 'No tienes permiso para eliminar este entrenamiento.';
  end if;

  delete from public.arrows
  where series_id in (
    select series.id
    from public.series
    join public.training_rounds
      on training_rounds.id = series.training_round_id
    where training_rounds.training_session_id = p_training_id
  );

  delete from public.series
  where training_round_id in (
    select id
    from public.training_rounds
    where training_session_id = p_training_id
  );

  delete from public.training_rounds
  where training_session_id = p_training_id;

  delete from public.training_sessions
  where id = p_training_id;
end;
$tal_delete_training$;

grant execute on function public.delete_training_session(uuid) to authenticated;
notify pgrst, 'reload schema';
