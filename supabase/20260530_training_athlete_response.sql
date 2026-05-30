-- Athlete confirmation state for scheduled training sessions.
-- Run this once in the Supabase SQL editor.

alter table public.training_sessions
  add column if not exists athlete_response_status text not null default 'pending'
    check (athlete_response_status in ('pending', 'accepted', 'rejected')),
  add column if not exists athlete_responded_at timestamp with time zone;

create index if not exists training_sessions_athlete_response_status_idx
  on public.training_sessions (athlete_response_status);
