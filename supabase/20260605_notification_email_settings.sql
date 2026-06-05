-- TAL notification SMTP settings.
-- Run this full script in Supabase SQL Editor with "Run", not "Analyze".

create table if not exists public.notification_email_settings (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Principal',
  smtp_host text not null,
  smtp_port integer not null default 587 check (smtp_port > 0 and smtp_port <= 65535),
  smtp_secure boolean not null default false,
  smtp_username text,
  smtp_password text,
  from_name text not null default 'Tech Archery Lab',
  from_email text not null,
  reply_to text,
  is_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists notification_email_settings_singleton_idx
  on public.notification_email_settings ((true));

alter table public.notification_email_settings enable row level security;

drop policy if exists "Admins can read notification email settings"
  on public.notification_email_settings;
drop policy if exists "Admins can insert notification email settings"
  on public.notification_email_settings;
drop policy if exists "Admins can update notification email settings"
  on public.notification_email_settings;

create policy "Admins can read notification email settings"
  on public.notification_email_settings for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

create policy "Admins can insert notification email settings"
  on public.notification_email_settings for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

create policy "Admins can update notification email settings"
  on public.notification_email_settings for update
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

notify pgrst, 'reload schema';
