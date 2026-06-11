-- TAL athlete achievement zone.
-- Coach/admin can define the score range used to calculate athlete effectiveness.

alter table public.athlete_profiles
  add column if not exists achievement_zone_min_score integer,
  add column if not exists achievement_zone_max_score integer;

update public.athlete_profiles
set achievement_zone_min_score = coalesce(achievement_zone_min_score, 9),
    achievement_zone_max_score = coalesce(achievement_zone_max_score, 10)
where achievement_zone_min_score is null
   or achievement_zone_max_score is null;

alter table public.athlete_profiles
  alter column achievement_zone_min_score set default 9,
  alter column achievement_zone_max_score set default 10,
  alter column achievement_zone_min_score set not null,
  alter column achievement_zone_max_score set not null;

alter table public.athlete_profiles
  drop constraint if exists athlete_profiles_achievement_zone_min_check,
  drop constraint if exists athlete_profiles_achievement_zone_max_check,
  drop constraint if exists athlete_profiles_achievement_zone_order_check;

alter table public.athlete_profiles
  add constraint athlete_profiles_achievement_zone_min_check
    check (achievement_zone_min_score between 0 and 10),
  add constraint athlete_profiles_achievement_zone_max_check
    check (achievement_zone_max_score between 0 and 10),
  add constraint athlete_profiles_achievement_zone_order_check
    check (achievement_zone_min_score <= achievement_zone_max_score);

create or replace function public.update_athlete_achievement_zone(
  p_athlete_id uuid,
  p_min_score integer,
  p_max_score integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $tal_achievement_zone$
declare
  v_actor record;
  v_athlete record;
begin
  select id, role, club_id
  into v_actor
  from public.users
  where id = auth.uid();

  if v_actor.id is null or v_actor.role::text not in ('admin', 'coach') then
    raise exception 'Solo admin o coach pueden editar la zona de logro.';
  end if;

  if p_min_score is null
    or p_max_score is null
    or p_min_score < 0
    or p_min_score > 10
    or p_max_score < 0
    or p_max_score > 10
    or p_min_score > p_max_score
  then
    raise exception 'La zona de logro debe ser un rango valido entre 0 y 10.';
  end if;

  select id, club_id
  into v_athlete
  from public.athlete_profiles
  where id = p_athlete_id;

  if v_athlete.id is null then
    raise exception 'Atleta no encontrado.';
  end if;

  if v_actor.role::text = 'coach' and v_athlete.club_id is distinct from v_actor.club_id then
    raise exception 'No puedes editar atletas de otro club.';
  end if;

  update public.athlete_profiles
  set achievement_zone_min_score = p_min_score,
      achievement_zone_max_score = p_max_score,
      updated_at = now()
  where id = p_athlete_id;
end;
$tal_achievement_zone$;

grant execute on function public.update_athlete_achievement_zone(uuid, integer, integer)
  to authenticated;
