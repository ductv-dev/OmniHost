begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'unassigned@test.local', '', '{}', '{}', now(), now());

insert into public.common_templates (name, category, content)
values ('Visible only to assigned staff', 'test', 'test');

insert into public.buildings (id, name, address)
values ('21000000-0000-0000-0000-000000000001', 'Role test', 'Test');

select throws_ok(
  $$ insert into public.staff_assignments (user_id, building_id, role) values ('11000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'super_admin') $$,
  '23514',
  null,
  'super admin is not a building role'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);

select is_empty(
  $$ select id from public.common_templates $$,
  'unassigned users cannot read shared templates'
);

select is_empty(
  $$ select id from public.message_flows $$,
  'unassigned users cannot read message flows'
);

select throws_ok(
  $$ insert into public.guests (full_name, created_by) values ('No access', '11000000-0000-0000-0000-000000000001') $$,
  '42501',
  'new row violates row-level security policy for table "guests"',
  'unassigned users cannot create guest records'
);

select * from finish();
rollback;
