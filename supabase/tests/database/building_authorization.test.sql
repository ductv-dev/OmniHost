begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

-- Isolated authorization fixtures.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@test.local', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'manager@test.local', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'staff@test.local', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'agent@test.local', '', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'other@test.local', '', '{}', '{}', now(), now());

update public.profiles
set is_super_admin = true
where id = '10000000-0000-0000-0000-000000000001';

insert into public.buildings (id, name, address) values
  ('20000000-0000-0000-0000-000000000001', 'Building A', 'A'),
  ('20000000-0000-0000-0000-000000000002', 'Building B', 'B');

insert into public.staff_assignments (user_id, building_id, role) values
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'manager'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'staff'),
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'booking_agent'),
  ('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'manager');

insert into public.rooms (id, building_id, room_number, floor) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'A1', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'B1', 1);

insert into public.guests (id, full_name, created_by) values
  ('40000000-0000-0000-0000-000000000001', 'Guest A', '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000002', 'Guest B', '10000000-0000-0000-0000-000000000005');

insert into public.bookings (
  id, building_id, room_id, guest_id, check_in, check_out, created_by
) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '2030-01-01', '2030-01-02', '10000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '2030-01-01', '2030-01-02', '10000000-0000-0000-0000-000000000005');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$ select count(*) from public.buildings $$,
  $$ values (1::bigint) $$,
  'manager sees only assigned buildings'
);
select results_eq(
  $$ select count(*) from public.rooms $$,
  $$ values (1::bigint) $$,
  'manager sees only assigned rooms'
);
select results_eq(
  $$ select count(*) from public.guests $$,
  $$ values (1::bigint) $$,
  'manager sees only guests connected to assigned buildings'
);
select results_eq(
  $$ select count(*) from public.bookings $$,
  $$ values (1::bigint) $$,
  'manager sees only assigned bookings'
);
select lives_ok(
  $$ insert into public.room_rates (room_id, date, price) values ('30000000-0000-0000-0000-000000000001', '2030-01-01', 100) $$,
  'manager can set rates'
);
select lives_ok(
  $$ insert into public.common_templates (name, category, content) values ('T', 'C', 'Body') $$,
  'manager can create shared templates'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select results_eq(
  $$ select count(*) from public.buildings $$,
  $$ values (1::bigint) $$,
  'booking agent sees assigned building'
);
select throws_ok(
  $$ insert into public.room_rates (room_id, date, price) values ('30000000-0000-0000-0000-000000000001', '2030-01-02', 100) $$,
  '42501'
);
select throws_ok(
  $$ insert into public.room_blocks (room_id, start_date, end_date) values ('30000000-0000-0000-0000-000000000001', '2030-02-01', '2030-02-02') $$,
  '42501'
);
select throws_ok(
  $$ insert into public.common_templates (name, category, content) values ('No', 'No', 'No') $$,
  '42501'
);
select throws_ok(
  $$ update public.profiles set is_super_admin = true where id = '10000000-0000-0000-0000-000000000004' $$,
  '42501'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select results_eq(
  $$ select count(*) from public.buildings $$,
  $$ values (2::bigint) $$,
  'super admin sees all buildings'
);

select * from finish();
rollback;
