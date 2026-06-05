-- TAL performance staff RLS fix.
-- Run this full script in Supabase SQL Editor with "Run", not "Analyze".

alter table public.performance_staff enable row level security;

drop policy if exists "Performance staff scoped read" on public.performance_staff;
drop policy if exists "Performance staff scoped insert" on public.performance_staff;
drop policy if exists "Performance staff scoped update" on public.performance_staff;
drop policy if exists "Admins and club coaches can read performance staff" on public.performance_staff;
drop policy if exists "Admins and club coaches can insert performance staff" on public.performance_staff;
drop policy if exists "Admins and club coaches can update performance staff" on public.performance_staff;

create policy "Performance staff scoped read"
  on public.performance_staff for select
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
            and users.club_id = performance_staff.club_id
          )
          or (
            users.role::text = 'physical_trainer'
            and performance_staff.user_id = users.id
          )
          or (
            users.role::text = 'sports_psychologist'
            and performance_staff.user_id = users.id
          )
        )
    )
  );

create policy "Performance staff scoped insert"
  on public.performance_staff for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and (
          users.role::text = 'admin'
          or (
            users.role::text = 'coach'
            and users.club_id is not null
            and users.club_id = performance_staff.club_id
          )
        )
    )
  );

create policy "Performance staff scoped update"
  on public.performance_staff for update
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
            and users.club_id = performance_staff.club_id
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
            and users.club_id = performance_staff.club_id
          )
        )
    )
  );

grant select, insert, update on public.performance_staff to authenticated;
notify pgrst, 'reload schema';
