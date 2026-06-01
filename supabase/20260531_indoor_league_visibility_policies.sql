-- Minimal visibility policies for invited coaches and enrolled athletes.
-- Run this if coaches do not see leagues after being invited.

alter table public.indoor_league_coaches enable row level security;
alter table public.indoor_league_athletes enable row level security;

drop policy if exists "Authenticated users can read indoor league coaches" on public.indoor_league_coaches;
drop policy if exists "Authenticated users can read indoor league athletes" on public.indoor_league_athletes;

create policy "Authenticated users can read indoor league coaches"
  on public.indoor_league_coaches for select
  to authenticated
  using (true);

create policy "Authenticated users can read indoor league athletes"
  on public.indoor_league_athletes for select
  to authenticated
  using (true);

notify pgrst, 'reload schema';
