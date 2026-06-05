-- TAL clubs RLS policies.
-- Allows authenticated users to read active clubs and admins to manage clubs.

alter table public.clubs enable row level security;

drop policy if exists "Authenticated users can read clubs" on public.clubs;
drop policy if exists "Admins can insert clubs" on public.clubs;
drop policy if exists "Admins can update clubs" on public.clubs;
drop policy if exists "Admins can delete clubs" on public.clubs;

create policy "Authenticated users can read clubs"
  on public.clubs for select
  to authenticated
  using (true);

create policy "Admins can insert clubs"
  on public.clubs for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

create policy "Admins can update clubs"
  on public.clubs for update
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

create policy "Admins can delete clubs"
  on public.clubs for delete
  to authenticated
  using (
    exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.role::text = 'admin'
    )
  );

notify pgrst, 'reload schema';
