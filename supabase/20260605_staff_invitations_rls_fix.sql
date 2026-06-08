-- TAL staff invitations RLS fix.
-- Run this full script in Supabase SQL Editor with "Run", not "Analyze".

alter table public.staff_invitations enable row level security;

drop policy if exists "Staff invitations admin read" on public.staff_invitations;
drop policy if exists "Staff invitations admin insert" on public.staff_invitations;
drop policy if exists "Staff invitations admin update" on public.staff_invitations;
drop policy if exists "Staff invitations public pending read" on public.staff_invitations;
drop policy if exists "Staff invitations public accept update" on public.staff_invitations;

create policy "Staff invitations admin read"
  on public.staff_invitations for select
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

create policy "Staff invitations admin insert"
  on public.staff_invitations for insert
  to authenticated
  with check (
    invited_by = auth.uid()
    and role in ('coach', 'admin')
    and exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

create policy "Staff invitations admin update"
  on public.staff_invitations for update
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

create policy "Staff invitations public pending read"
  on public.staff_invitations for select
  to anon
  using (
    accepted_at is null
    and expires_at > now()
  );

create policy "Staff invitations public accept update"
  on public.staff_invitations for update
  to anon
  using (
    accepted_at is null
    and expires_at > now()
  )
  with check (
    accepted_at is not null
  );

grant select, insert, update on public.staff_invitations to authenticated;
revoke update on public.staff_invitations from anon;
grant select on public.staff_invitations to anon;
grant update (accepted_at, updated_at) on public.staff_invitations to anon;
notify pgrst, 'reload schema';
