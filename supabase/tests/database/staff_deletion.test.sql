begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values ('12000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'delete@test.local', '', '{}', '{}', now(), now());

insert into public.buildings (id, name, address)
values ('22000000-0000-0000-0000-000000000001', 'Delete test', 'Test');

insert into public.staff_assignments (user_id, building_id, role)
values ('12000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'staff');

insert into public.rooms (id, building_id, room_number, floor)
values ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'D1', 1);

insert into public.guests (id, full_name, created_by)
values ('42000000-0000-0000-0000-000000000001', 'Delete guest', '12000000-0000-0000-0000-000000000001');

insert into public.bookings (id, building_id, room_id, guest_id, check_in, check_out, created_by)
values ('52000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', '2032-01-01', '2032-01-02', '12000000-0000-0000-0000-000000000001');

insert into public.room_blocks (id, room_id, start_date, end_date, created_by)
values ('62000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', '2032-02-01', '2032-02-02', '12000000-0000-0000-0000-000000000001');

insert into public.payments (id, booking_id, amount, created_by)
values ('72000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 100, '12000000-0000-0000-0000-000000000001');

delete from auth.users where id = '12000000-0000-0000-0000-000000000001';

select is_empty($$ select id from public.profiles where id = '12000000-0000-0000-0000-000000000001' $$, 'profile is removed');
select is_empty($$ select id from public.staff_assignments where user_id = '12000000-0000-0000-0000-000000000001' $$, 'assignments are removed');
select results_eq($$ select created_by from public.bookings where id = '52000000-0000-0000-0000-000000000001' $$, $$ values (null::uuid) $$, 'booking is preserved without creator');
select results_eq($$ select created_by from public.guests where id = '42000000-0000-0000-0000-000000000001' $$, $$ values (null::uuid) $$, 'guest is preserved without creator');
select results_eq($$ select created_by from public.room_blocks where id = '62000000-0000-0000-0000-000000000001' $$, $$ values (null::uuid) $$, 'room block is preserved without creator');
select results_eq($$ select created_by from public.payments where id = '72000000-0000-0000-0000-000000000001' $$, $$ values (null::uuid) $$, 'payment is preserved without creator');

select * from finish();
rollback;
