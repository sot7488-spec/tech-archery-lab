-- TAL routine completion state for mixed training sessions.

alter table public.training_routine_blocks
  add column if not exists status text not null default 'active',
  add column if not exists feedback text,
  add column if not exists completed_at timestamp with time zone;

alter table public.training_routine_blocks
  drop constraint if exists training_routine_blocks_status_check;

alter table public.training_routine_blocks
  add constraint training_routine_blocks_status_check
  check (status in ('active', 'completed'));

create index if not exists training_routine_blocks_session_status_idx
  on public.training_routine_blocks (training_session_id, status, routine_number);
