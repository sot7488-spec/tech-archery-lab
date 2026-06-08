-- TAL multi-round training sessions.
-- Run this in Supabase SQL editor before using multi-distance training plans.

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

create index if not exists training_rounds_session_status_idx
  on public.training_rounds (training_session_id, status, round_number);
