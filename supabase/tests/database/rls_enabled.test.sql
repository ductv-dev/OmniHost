begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

select ok(relrowsecurity, relname || ' has RLS enabled')
from pg_class
where oid in (
  'public.buildings'::regclass,
  'public.common_templates'::regclass,
  'public.message_flows'::regclass,
  'public.rooms'::regclass,
  'public.profiles'::regclass,
  'public.staff_assignments'::regclass,
  'public.guests'::regclass,
  'public.bookings'::regclass,
  'public.room_rates'::regclass,
  'public.room_blocks'::regclass,
  'public.payments'::regclass,
  'public.booking_history'::regclass
)
order by relname;

select ok(
  not has_table_privilege('anon', table_name, 'SELECT'),
  table_name || ' denies anon SELECT'
)
from unnest(array[
  'public.buildings',
  'public.common_templates',
  'public.message_flows',
  'public.rooms',
  'public.profiles',
  'public.staff_assignments',
  'public.guests',
  'public.bookings',
  'public.room_rates',
  'public.room_blocks',
  'public.payments',
  'public.booking_history'
]) as tables(table_name);

select * from finish();

rollback;
