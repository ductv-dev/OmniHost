begin;

alter table public.staff_assignments
  drop constraint if exists staff_assignments_role_check;

alter table public.staff_assignments
  add constraint staff_assignments_role_check
  check (role in ('manager', 'staff', 'booking_agent'));

drop policy if exists "common_templates: select" on public.common_templates;
create policy "common_templates: select" on public.common_templates
  for select to authenticated
  using (private.has_any_building_role(array['manager','staff','booking_agent']));

drop policy if exists "message_flows: select" on public.message_flows;
create policy "message_flows: select" on public.message_flows
  for select to authenticated
  using (private.has_any_building_role(array['manager','staff','booking_agent']));

drop policy if exists "guests: insert" on public.guests;
create policy "guests: insert" on public.guests
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.has_any_building_role(array['manager','staff','booking_agent'])
  );

commit;
