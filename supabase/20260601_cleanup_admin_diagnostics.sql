-- Diagnostics before TAL cleanup.
-- Run this first if the cleanup safety check fails.

select
  'public.users exact email' as check_name,
  id,
  email,
  role::text as role,
  club_id,
  is_active
from public.users
where lower(trim(email)) = lower(trim('sot7488@gmail.com'));

select
  'auth.users exact email' as check_name,
  id,
  email,
  created_at
from auth.users
where lower(trim(email)) = lower(trim('sot7488@gmail.com'));

select
  'public/auth joined by public email' as check_name,
  users.id as public_user_id,
  users.email as public_email,
  users.role::text as public_role,
  auth_users.id as auth_user_id,
  auth_users.email as auth_email
from public.users as users
left join auth.users as auth_users on auth_users.id = users.id
where lower(trim(users.email)) = lower(trim('sot7488@gmail.com'));

select
  'all public users' as check_name,
  id,
  email,
  role::text as role,
  is_active
from public.users
order by created_at;

select
  'all auth users' as check_name,
  id,
  email,
  created_at
from auth.users
order by created_at;
