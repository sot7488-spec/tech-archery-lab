-- TAL training routine blocks.
-- Adds strength/SPT routine blocks directly inside a scheduled training session.

create table if not exists public.training_routine_blocks (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  routine_number integer not null check (routine_number > 0),
  routine_type text not null check (routine_type in ('strength', 'spt')),
  title text,
  focus_area text,
  objective text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  intensity text,
  exercises text,
  sets text,
  reps text,
  load text,
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  tempo text,
  technical_cue text,
  spt_drill text,
  spt_volume text,
  bow_load text,
  hold_seconds integer check (hold_seconds is null or hold_seconds >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists training_routine_blocks_session_idx
  on public.training_routine_blocks (training_session_id, routine_number);

grant select, insert, update, delete on public.training_routine_blocks to authenticated;

alter table public.training_routine_blocks enable row level security;

create or replace function public.can_read_training_session(p_training_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_sessions ts
    join public.users u on u.id = auth.uid()
    left join public.athlete_profiles ap on ap.id = ts.athlete_id
    where ts.id = p_training_id
      and (
        u.role::text = 'admin'
        or (
          u.role::text = 'coach'
          and u.club_id = ts.club_id
        )
        or (
          u.role::text = 'athlete'
          and ap.user_id = u.id
        )
      )
  );
$$;

create or replace function public.can_manage_training_session(p_training_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.training_sessions ts
    join public.users u on u.id = auth.uid()
    where ts.id = p_training_id
      and (
        u.role::text = 'admin'
        or (
          u.role::text = 'coach'
          and u.club_id = ts.club_id
        )
      )
  );
$$;

grant execute on function public.can_read_training_session(uuid) to authenticated;
grant execute on function public.can_manage_training_session(uuid) to authenticated;

drop policy if exists "Training routine blocks scoped read" on public.training_routine_blocks;
drop policy if exists "Training routine blocks scoped insert" on public.training_routine_blocks;
drop policy if exists "Training routine blocks scoped update" on public.training_routine_blocks;
drop policy if exists "Training routine blocks scoped delete" on public.training_routine_blocks;

create policy "Training routine blocks scoped read"
  on public.training_routine_blocks for select
  to authenticated
  using (public.can_read_training_session(training_session_id));

create policy "Training routine blocks scoped insert"
  on public.training_routine_blocks for insert
  to authenticated
  with check (public.can_manage_training_session(training_session_id));

create policy "Training routine blocks scoped update"
  on public.training_routine_blocks for update
  to authenticated
  using (public.can_manage_training_session(training_session_id))
  with check (public.can_manage_training_session(training_session_id));

create policy "Training routine blocks scoped delete"
  on public.training_routine_blocks for delete
  to authenticated
  using (public.can_manage_training_session(training_session_id));
