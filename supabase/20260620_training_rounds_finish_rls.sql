-- TAL training round finish RLS repair.
-- Allows progress updates for rounds in sessions visible to admin, club coach,
-- or the athlete owner. Run this if finishing a round keeps it active.

alter table public.training_rounds
  add column if not exists scoring_enabled boolean not null default true,
  add column if not exists session_type text,
  add column if not exists objective text,
  add column if not exists status text not null default 'active',
  add column if not exists feedback text,
  add column if not exists completed_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

alter table public.training_rounds
  drop constraint if exists training_rounds_status_check;

alter table public.training_rounds
  add constraint training_rounds_status_check
  check (status in ('active', 'completed'));

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
        or (u.role::text = 'coach' and u.club_id = ts.club_id)
        or (u.role::text = 'athlete' and ap.user_id = u.id)
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
        or (u.role::text = 'coach' and u.club_id = ts.club_id)
      )
  );
$$;

create or replace function public.can_update_training_progress(p_training_id uuid)
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
        or (u.role::text = 'coach' and u.club_id = ts.club_id)
        or (u.role::text = 'athlete' and ap.user_id = u.id)
      )
  );
$$;

grant execute on function public.can_read_training_session(uuid) to authenticated;
grant execute on function public.can_manage_training_session(uuid) to authenticated;
grant execute on function public.can_update_training_progress(uuid) to authenticated;

grant select, insert, update, delete on public.training_rounds to authenticated;

alter table public.training_rounds enable row level security;

drop policy if exists "Training rounds scoped read" on public.training_rounds;
drop policy if exists "Training rounds scoped insert" on public.training_rounds;
drop policy if exists "Training rounds scoped update" on public.training_rounds;
drop policy if exists "Training rounds scoped delete" on public.training_rounds;

create policy "Training rounds scoped read"
  on public.training_rounds for select
  to authenticated
  using (public.can_read_training_session(training_session_id));

create policy "Training rounds scoped insert"
  on public.training_rounds for insert
  to authenticated
  with check (public.can_manage_training_session(training_session_id));

create policy "Training rounds scoped update"
  on public.training_rounds for update
  to authenticated
  using (public.can_update_training_progress(training_session_id))
  with check (public.can_update_training_progress(training_session_id));

create policy "Training rounds scoped delete"
  on public.training_rounds for delete
  to authenticated
  using (public.can_manage_training_session(training_session_id));

create index if not exists training_rounds_session_status_idx
  on public.training_rounds (training_session_id, status, round_number);
