begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.buildings (id, name, address) values
  ('61000000-0000-0000-0000-000000000001', 'Integrity A', 'A'),
  ('61000000-0000-0000-0000-000000000002', 'Integrity B', 'B');
insert into public.rooms (id, building_id, room_number, floor) values
  ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'A1', 1);
insert into public.guests (id, full_name) values
  ('63000000-0000-0000-0000-000000000001', 'Integrity Guest');

insert into public.room_blocks (id, room_id, start_date, end_date) values
  ('64000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', '2031-01-01', '2031-01-03');

select throws_ok(
  $$ insert into public.bookings (building_id, room_id, guest_id, check_in, check_out) values ('61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', '2031-01-02', '2031-01-04') $$,
  '23P01'
);

delete from public.room_blocks where id = '64000000-0000-0000-0000-000000000001';
insert into public.bookings (id, building_id, room_id, guest_id, check_in, check_out) values
  ('65000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', '2031-01-02', '2031-01-04');

select throws_ok(
  $$ insert into public.room_blocks (room_id, start_date, end_date) values ('62000000-0000-0000-0000-000000000001', '2031-01-03', '2031-01-05') $$,
  '23P01'
);
select throws_ok(
  $$ insert into public.bookings (building_id, room_id, guest_id, check_in, check_out) values ('61000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', '2031-02-01', '2031-02-02') $$,
  '23503'
);
select throws_ok(
  $$ insert into public.bookings (building_id, room_id, guest_id, check_in, check_out, num_adults) values ('61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', '2031-02-01', '2031-02-02', 0) $$,
  '23514'
);
select throws_ok(
  $$ insert into public.bookings (building_id, room_id, guest_id, check_in, check_out, total_price, deposit_paid) values ('61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', '2031-02-01', '2031-02-02', 100, 101) $$,
  '23514'
);

select results_eq(
  $$ select count(*) from public.booking_history where booking_id = '65000000-0000-0000-0000-000000000001' and action = 'created' $$,
  $$ values (1::bigint) $$,
  'booking insert is audited automatically'
);

delete from public.bookings where id = '65000000-0000-0000-0000-000000000001';
select results_eq(
  $$ select count(*) from public.booking_history where booking_id = '65000000-0000-0000-0000-000000000001' and action = 'deleted' and booking_snapshot is not null $$,
  $$ values (1::bigint) $$,
  'delete audit survives booking deletion'
);

select * from finish();
rollback;
