-- TAL demo seed, no ON CONFLICT version.
-- Creates 3 clubs, 1 coach per club, and 5 athletes per club.
--
-- Login password for every demo coach/athlete:
--   TalDemo2026!
--
-- This script first removes any partially-created demo rows, then inserts fresh data.

begin;

create extension if not exists pgcrypto;

create temporary table tal_demo_users (
  id uuid primary key,
  email text not null unique,
  name text not null,
  role text not null,
  club_id uuid,
  coach_id uuid,
  birthdate date,
  gender text,
  category text,
  bow_type text
);

insert into tal_demo_users (id, email, name, role, club_id, coach_id, birthdate, gender, category, bow_type)
values
  ('20000000-0000-4000-8000-000000000001', 'coach.bajio@tal.demo', 'Mariana Torres', 'coach', '10000000-0000-4000-8000-000000000001', null, '1987-04-18', 'femenil', null, null),
  ('20000000-0000-4000-8000-000000000002', 'coach.queretaro@tal.demo', 'Ricardo Salinas', 'coach', '10000000-0000-4000-8000-000000000002', null, '1982-09-02', 'masculino', null, null),
  ('20000000-0000-4000-8000-000000000003', 'coach.valle@tal.demo', 'Laura Mendoza', 'coach', '10000000-0000-4000-8000-000000000003', null, '1990-01-27', 'femenil', null, null),
  ('30000000-0000-4000-8000-000000000001', 'sofia.ramirez@tal.demo', 'Sofia Ramirez', 'athlete', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2012-03-12', 'femenil', 'infantil', 'recurvo'),
  ('30000000-0000-4000-8000-000000000002', 'diego.martinez@tal.demo', 'Diego Martinez', 'athlete', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2010-07-24', 'masculino', 'juvenil', 'compuesto'),
  ('30000000-0000-4000-8000-000000000003', 'valeria.gomez@tal.demo', 'Valeria Gomez', 'athlete', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2008-11-05', 'femenil', 'juvenil', 'recurvo'),
  ('30000000-0000-4000-8000-000000000004', 'mateo.herrera@tal.demo', 'Mateo Herrera', 'athlete', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2015-02-19', 'masculino', 'iniciacion', 'barebow'),
  ('30000000-0000-4000-8000-000000000005', 'camila.navarro@tal.demo', 'Camila Navarro', 'athlete', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '2005-08-30', 'femenil', 'abierta', 'compuesto'),
  ('30000000-0000-4000-8000-000000000006', 'andrea.castillo@tal.demo', 'Andrea Castillo', 'athlete', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '2011-01-16', 'femenil', 'juvenil', 'recurvo'),
  ('30000000-0000-4000-8000-000000000007', 'luis.ortega@tal.demo', 'Luis Ortega', 'athlete', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '2009-05-09', 'masculino', 'juvenil', 'barebow'),
  ('30000000-0000-4000-8000-000000000008', 'renata.ibarra@tal.demo', 'Renata Ibarra', 'athlete', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '2014-10-22', 'femenil', 'infantil', 'recurvo'),
  ('30000000-0000-4000-8000-000000000009', 'emiliano.cruz@tal.demo', 'Emiliano Cruz', 'athlete', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '2003-06-14', 'masculino', 'abierta', 'compuesto'),
  ('30000000-0000-4000-8000-000000000010', 'paula.medina@tal.demo', 'Paula Medina', 'athlete', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '2016-12-01', 'femenil', 'iniciacion', 'barebow'),
  ('30000000-0000-4000-8000-000000000011', 'ximena.rojas@tal.demo', 'Ximena Rojas', 'athlete', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '2010-04-03', 'femenil', 'juvenil', 'compuesto'),
  ('30000000-0000-4000-8000-000000000012', 'santiago.leon@tal.demo', 'Santiago Leon', 'athlete', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '2013-09-18', 'masculino', 'infantil', 'recurvo'),
  ('30000000-0000-4000-8000-000000000013', 'isabella.mora@tal.demo', 'Isabella Mora', 'athlete', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '2006-02-07', 'femenil', 'abierta', 'barebow'),
  ('30000000-0000-4000-8000-000000000014', 'nicolas.aguilar@tal.demo', 'Nicolas Aguilar', 'athlete', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '2015-06-26', 'masculino', 'iniciacion', 'recurvo'),
  ('30000000-0000-4000-8000-000000000015', 'mariana.vega@tal.demo', 'Mariana Vega', 'athlete', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '2008-12-11', 'femenil', 'juvenil', 'compuesto');

-- Remove partial demo data if a previous seed failed halfway.
delete from public.equipment_profiles
where athlete_id in (
  select athlete_profiles.id
  from public.athlete_profiles
  join tal_demo_users on tal_demo_users.id = athlete_profiles.user_id
);

delete from public.athlete_profiles
where user_id in (select id from tal_demo_users);

delete from public.coach_profiles
where user_id in (select id from tal_demo_users);

delete from public.users
where id in (select id from tal_demo_users)
   or email in (select email from tal_demo_users);

delete from auth.identities
where user_id in (select id from tal_demo_users)
   or identity_data ->> 'email' in (select email from tal_demo_users);

delete from auth.users
where id in (select id from tal_demo_users)
   or email in (select email from tal_demo_users);

delete from public.clubs
where id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid
);

insert into public.clubs (id, name, city, state, country, logo_url, is_active, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'Arqueros del Bajio', 'Leon', 'Guanajuato', 'Mexico', null, true, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'Tiro con Arco Queretaro', 'Queretaro', 'Queretaro', 'Mexico', null, true, now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'Flechas del Valle', 'Metepec', 'Estado de Mexico', 'Mexico', null, true, now(), now());

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  crypt('TalDemo2026!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', name),
  now(),
  now(),
  false,
  false,
  false
from tal_demo_users;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  id,
  id::text,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from tal_demo_users;

insert into public.users (
  id,
  club_id,
  name,
  email,
  role,
  phone,
  profile_photo_url,
  is_active,
  created_at,
  updated_at
)
select
  id,
  club_id,
  name,
  email,
  role::user_role,
  null,
  null,
  true,
  now(),
  now()
from tal_demo_users;

insert into public.coach_profiles (
  user_id,
  club_id,
  birthdate,
  gender,
  specialty,
  certification_level,
  certification_institution,
  years_experience,
  phone,
  bio,
  is_active,
  created_at,
  updated_at
)
select
  id,
  club_id,
  birthdate,
  gender,
  'Entrenamiento indoor y desarrollo tecnico',
  'Nivel 2',
  'Federacion Mexicana de Tiro con Arco',
  8,
  null,
  'Perfil demo para pruebas de TAL.',
  true,
  now(),
  now()
from tal_demo_users
where role = 'coach';

insert into public.athlete_profiles (
  user_id,
  coach_id,
  birthdate,
  gender,
  category,
  bow_type,
  dominant_hand,
  notes,
  club_id,
  association_id,
  federation_id,
  created_at,
  updated_at
)
select
  id,
  coach_id,
  birthdate,
  gender,
  category,
  bow_type::bow_type,
  null,
  'Atleta demo con perfil base para pruebas de club, liga, equipamiento y analiticos.',
  club_id,
  'DEMO-ASOC-' || right(id::text, 4),
  'DEMO-FED-' || right(id::text, 4),
  now(),
  now()
from tal_demo_users
where role = 'athlete';

insert into public.equipment_profiles (
  athlete_id,
  name,
  bow_type,
  bow_brand,
  bow_model,
  draw_weight_lbs,
  arrow_brand,
  arrow_model,
  spine,
  arrow_length_inches,
  point_weight_grains,
  brace_height_cm,
  is_active,
  notes,
  created_at,
  updated_at
)
select
  athlete_profiles.id,
  'Equipo principal',
  tal_demo_users.bow_type,
  case tal_demo_users.bow_type when 'compuesto' then 'Hoyt' when 'barebow' then 'Spigarelli' else 'Win&Win' end,
  case tal_demo_users.bow_type when 'compuesto' then 'Stratos' when 'barebow' then 'Barebow 650' else 'Wiawis ATF-DX' end,
  case tal_demo_users.category when 'iniciacion' then 22 when 'infantil' then 26 when 'juvenil' then 32 else 38 end,
  'Easton',
  case tal_demo_users.bow_type when 'compuesto' then 'X10 ProTour' else 'Avance' end,
  case tal_demo_users.category when 'iniciacion' then '900' when 'infantil' then '800' when 'juvenil' then '650' else '500' end,
  case tal_demo_users.category when 'iniciacion' then 25 when 'infantil' then 26 when 'juvenil' then 27.5 else 28.5 end,
  case tal_demo_users.bow_type when 'compuesto' then 110 else 90 end,
  case tal_demo_users.bow_type when 'compuesto' then 18.5 else 21.8 end,
  true,
  'Equipo demo generado para pruebas.',
  now(),
  now()
from tal_demo_users
join public.athlete_profiles on athlete_profiles.user_id = tal_demo_users.id
where tal_demo_users.role = 'athlete';

commit;

select
  clubs.name as club,
  count(*) filter (where users.role::text = 'coach') as coaches,
  count(*) filter (where users.role::text = 'athlete') as athletes
from public.users
join public.clubs on clubs.id = users.club_id
where users.email like '%@tal.demo'
group by clubs.name
order by clubs.name;

select email, 'TalDemo2026!' as password
from public.users
where email like '%@tal.demo'
order by role::text, email;
