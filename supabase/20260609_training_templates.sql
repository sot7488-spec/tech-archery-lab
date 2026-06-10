-- TAL training templates.
-- Presets that admin and coaches can use to schedule trainings faster.

create table if not exists public.training_templates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  session_type text,
  location text,
  weather text,
  objective text,
  brace_height_cm numeric,
  wind_speed_kmh numeric,
  temperature_c numeric,
  rounds jsonb not null default '[]'::jsonb,
  routines jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists training_templates_club_active_idx
  on public.training_templates (club_id, is_active, created_at desc);

grant select, insert, update, delete on public.training_templates to authenticated;

alter table public.training_templates enable row level security;

drop policy if exists "Training templates scoped read" on public.training_templates;
drop policy if exists "Training templates scoped insert" on public.training_templates;
drop policy if exists "Training templates scoped update" on public.training_templates;
drop policy if exists "Training templates scoped delete" on public.training_templates;

create policy "Training templates scoped read"
  on public.training_templates for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = training_templates.club_id
          )
        )
    )
  );

create policy "Training templates scoped insert"
  on public.training_templates for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = training_templates.club_id
          )
        )
    )
  );

create policy "Training templates scoped update"
  on public.training_templates for update
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = training_templates.club_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = training_templates.club_id
          )
        )
    )
  );

create policy "Training templates scoped delete"
  on public.training_templates for delete
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id = training_templates.club_id
          )
        )
    )
  );
