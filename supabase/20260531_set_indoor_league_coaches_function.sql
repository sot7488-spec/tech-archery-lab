-- Minimal fix for league coach invitations.
-- Run this in Supabase SQL editor if /leagues/[id]/edit says:
-- "Could not find the function public.set_indoor_league_coaches(...) in the schema cache"

create or replace function public.set_indoor_league_coaches(
  p_league_id uuid,
  p_coach_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.users
    where users.id = auth.uid()
    and users.role = 'admin'
  ) then
    raise exception 'Solo admin puede editar coaches invitados.';
  end if;

  delete from public.indoor_league_coaches
  where league_id = p_league_id;

  insert into public.indoor_league_coaches (league_id, coach_id, invited_by)
  select p_league_id, coach_id, auth.uid()
  from unnest(coalesce(p_coach_ids, array[]::uuid[])) as coach_id;
end;
$$;

grant execute on function public.set_indoor_league_coaches(uuid, uuid[]) to authenticated;

notify pgrst, 'reload schema';
