-- TAL athlete gamification.
-- Adds reusable skill and achievement definitions plus athlete XP/event tables.

create table if not exists public.tal_skill_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text not null default 'performance',
  thresholds jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.tal_achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  xp_reward integer not null default 75,
  icon text,
  rule jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.athlete_xp_events (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  source_type text not null,
  source_id uuid,
  xp integer not null check (xp >= 0),
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.athlete_achievements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  achievement_code text not null references public.tal_achievement_definitions(code),
  unlocked_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (athlete_id, achievement_code)
);

create table if not exists public.athlete_skill_snapshots (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  skill_code text not null references public.tal_skill_definitions(code),
  level integer not null default 1 check (level between 1 and 5),
  progress integer not null default 0 check (progress between 0 and 100),
  value numeric not null default 0,
  calculated_at timestamp with time zone not null default now(),
  unique (athlete_id, skill_code)
);

create index if not exists athlete_xp_events_athlete_created_idx
  on public.athlete_xp_events (athlete_id, created_at desc);

create index if not exists athlete_achievements_athlete_idx
  on public.athlete_achievements (athlete_id, unlocked_at desc);

create index if not exists athlete_skill_snapshots_athlete_idx
  on public.athlete_skill_snapshots (athlete_id, skill_code);

insert into public.tal_skill_definitions (code, name, description, category, thresholds)
values
  ('precision', 'Precision', 'Flechas dentro de la zona de logro del atleta.', 'score', '[25,40,55,70,82]'::jsonb),
  ('consistency', 'Consistencia', 'Estabilidad del promedio entre entrenamientos.', 'score', '[25,45,62,78,90]'::jsonb),
  ('volume', 'Volumen', 'Cantidad de flechas puntuadas registradas.', 'training', '[100,300,750,1500,3000]'::jsonb),
  ('discipline', 'Disciplina', 'Entrenamientos finalizados.', 'training', '[1,3,8,15,30]'::jsonb),
  ('technique', 'Tecnica', 'Retroalimentaciones tecnicas recibidas.', 'video', '[1,3,6,10,20]'::jsonb)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    thresholds = excluded.thresholds,
    is_active = true;

insert into public.tal_achievement_definitions (code, name, description, xp_reward, icon, rule)
values
  ('first_training', 'Primer entrenamiento', 'Registro inicial completado.', 75, 'activity', '{"total_trainings":1}'::jsonb),
  ('arrows_100', '100 flechas', 'Base de volumen construida.', 75, 'crosshair', '{"total_arrows":100}'::jsonb),
  ('hot_zone', 'Zona caliente', '50% o mas dentro de zona de logro con al menos 30 flechas.', 90, 'target', '{"zone_effectiveness":50,"min_arrows":30}'::jsonb),
  ('x_hunter', 'Cazador de X', '10 o mas X registradas.', 90, 'x', '{"total_x":10}'::jsonb),
  ('video_feedback', 'Tecnica revisada', 'Cuenta con feedback tecnico por video.', 75, 'video', '{"video_feedback":1}'::jsonb),
  ('constancy_3', 'Constancia', '3 entrenamientos finalizados.', 100, 'flame', '{"completed_trainings":3}'::jsonb)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    xp_reward = excluded.xp_reward,
    icon = excluded.icon,
    rule = excluded.rule,
    is_active = true;

alter table public.tal_skill_definitions enable row level security;
alter table public.tal_achievement_definitions enable row level security;
alter table public.athlete_xp_events enable row level security;
alter table public.athlete_achievements enable row level security;
alter table public.athlete_skill_snapshots enable row level security;

drop policy if exists "Gamification definitions read" on public.tal_skill_definitions;
drop policy if exists "Achievement definitions read" on public.tal_achievement_definitions;
drop policy if exists "Athlete XP scoped read" on public.athlete_xp_events;
drop policy if exists "Athlete achievements scoped read" on public.athlete_achievements;
drop policy if exists "Athlete skill snapshots scoped read" on public.athlete_skill_snapshots;
drop policy if exists "Athlete XP coach admin insert" on public.athlete_xp_events;
drop policy if exists "Athlete achievements coach admin insert" on public.athlete_achievements;
drop policy if exists "Athlete skill snapshots coach admin upsert" on public.athlete_skill_snapshots;

create policy "Gamification definitions read"
  on public.tal_skill_definitions for select
  to authenticated
  using (true);

create policy "Achievement definitions read"
  on public.tal_achievement_definitions for select
  to authenticated
  using (true);

create policy "Athlete XP scoped read"
  on public.athlete_xp_events for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = athlete_xp_events.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_xp_events.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Athlete achievements scoped read"
  on public.athlete_achievements for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = athlete_achievements.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_achievements.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Athlete skill snapshots scoped read"
  on public.athlete_skill_snapshots for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role::text = 'coach'
        and users.club_id = athlete_skill_snapshots.club_id
    )
    or exists (
      select 1 from public.athlete_profiles
      where athlete_profiles.id = athlete_skill_snapshots.athlete_id
        and athlete_profiles.user_id = auth.uid()
    )
  );

create policy "Athlete XP coach admin insert"
  on public.athlete_xp_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (users.role::text = 'coach' and users.club_id = athlete_xp_events.club_id)
        )
    )
  );

create policy "Athlete achievements coach admin insert"
  on public.athlete_achievements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (users.role::text = 'coach' and users.club_id = athlete_achievements.club_id)
        )
    )
  );

create policy "Athlete skill snapshots coach admin upsert"
  on public.athlete_skill_snapshots for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (users.role::text = 'coach' and users.club_id = athlete_skill_snapshots.club_id)
        )
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (users.role::text = 'coach' and users.club_id = athlete_skill_snapshots.club_id)
        )
    )
  );

grant select on public.tal_skill_definitions to authenticated;
grant select on public.tal_achievement_definitions to authenticated;
grant select, insert on public.athlete_xp_events to authenticated;
grant select, insert on public.athlete_achievements to authenticated;
grant select, insert, update on public.athlete_skill_snapshots to authenticated;

notify pgrst, 'reload schema';
