-- Building-scoped authorization for a single organization deployment.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter table public.guests
  add column if not exists created_by uuid references public.profiles(id) on delete set null
  default auth.uid();

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_super_admin
     from public.profiles p
     where p.id = (select auth.uid())),
    false
  );
$$;

create or replace function private.has_building_role(
  target_building_id uuid,
  required_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_super_admin()
    or exists (
      select 1
      from public.staff_assignments sa
      where sa.user_id = (select auth.uid())
        and sa.building_id = target_building_id
        and sa.role = any(required_roles)
    );
$$;

create or replace function private.has_any_building_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_super_admin()
    or exists (
      select 1
      from public.staff_assignments sa
      where sa.user_id = (select auth.uid())
        and sa.role = any(required_roles)
    );
$$;

create or replace function private.can_access_building(target_building_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_super_admin()
    or exists (
      select 1
      from public.staff_assignments sa
      where sa.user_id = (select auth.uid())
        and sa.building_id = target_building_id
    );
$$;

create or replace function private.can_access_guest(target_guest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_super_admin()
    or exists (
      select 1
      from public.guests g
      where g.id = target_guest_id
        and g.created_by = (select auth.uid())
    )
    or exists (
      select 1
      from public.bookings b
      join public.staff_assignments sa on sa.building_id = b.building_id
      where b.guest_id = target_guest_id
        and sa.user_id = (select auth.uid())
    );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

update public.guests g
set created_by = coalesce(
  (
    select b.created_by
    from public.bookings b
    where b.guest_id = g.id and b.created_by is not null
    order by b.created_at
    limit 1
  ),
  (select p.id from public.profiles p where p.is_super_admin order by p.created_at limit 1),
  (select p.id from public.profiles p order by p.created_at limit 1)
)
where g.created_by is null;

create index if not exists idx_guests_created_by on public.guests(created_by);

grant select, insert, update, delete on table
  public.buildings,
  public.common_templates,
  public.message_flows,
  public.rooms,
  public.profiles,
  public.staff_assignments,
  public.guests,
  public.bookings,
  public.room_rates,
  public.room_blocks,
  public.payments,
  public.booking_history
to authenticated;

-- Profiles: users may edit contact fields, never their own privilege flag.
drop policy if exists "profiles: select" on public.profiles;
drop policy if exists "profiles: insert" on public.profiles;
drop policy if exists "profiles: update" on public.profiles;

create policy "profiles: select" on public.profiles for select to authenticated
  using (private.is_super_admin() or id = (select auth.uid()));
create policy "profiles: insert" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and is_super_admin = false);
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update(full_name, phone) on public.profiles to authenticated;

-- Staff assignments remain super-admin managed; users can inspect their own role.
drop policy if exists "staff_assignments: select" on public.staff_assignments;
drop policy if exists "staff_assignments: all" on public.staff_assignments;
drop policy if exists "staff_assignments: write" on public.staff_assignments;

create policy "staff_assignments: select" on public.staff_assignments
  for select to authenticated
  using (private.is_super_admin() or user_id = (select auth.uid()));
create policy "staff_assignments: write" on public.staff_assignments
  for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- Buildings and rooms are visible only when assigned.
drop policy if exists "buildings: select" on public.buildings;
drop policy if exists "buildings: insert" on public.buildings;
drop policy if exists "buildings: update" on public.buildings;
drop policy if exists "buildings: delete" on public.buildings;

create policy "buildings: select" on public.buildings for select to authenticated
  using (private.can_access_building(id));
create policy "buildings: insert" on public.buildings for insert to authenticated
  with check (private.is_super_admin());
create policy "buildings: update" on public.buildings for update to authenticated
  using (private.has_building_role(id, array['manager']))
  with check (private.has_building_role(id, array['manager']));
create policy "buildings: delete" on public.buildings for delete to authenticated
  using (private.is_super_admin());

drop policy if exists "rooms: select" on public.rooms;
drop policy if exists "rooms: insert" on public.rooms;
drop policy if exists "rooms: update" on public.rooms;
drop policy if exists "rooms: delete" on public.rooms;

create policy "rooms: select" on public.rooms for select to authenticated
  using (private.can_access_building(building_id));
create policy "rooms: insert" on public.rooms for insert to authenticated
  with check (private.has_building_role(building_id, array['manager']));
create policy "rooms: update" on public.rooms for update to authenticated
  using (private.has_building_role(building_id, array['manager']))
  with check (private.has_building_role(building_id, array['manager']));
create policy "rooms: delete" on public.rooms for delete to authenticated
  using (private.has_building_role(building_id, array['manager']));

-- Shared templates are readable by staff; only managers can change them.
drop policy if exists "common_templates: all" on public.common_templates;
drop policy if exists "message_flows: all" on public.message_flows;

create policy "common_templates: select" on public.common_templates
  for select to authenticated using (true);
create policy "common_templates: write" on public.common_templates
  for all to authenticated
  using (private.has_any_building_role(array['manager']))
  with check (private.has_any_building_role(array['manager']));
create policy "message_flows: select" on public.message_flows
  for select to authenticated using (true);
create policy "message_flows: write" on public.message_flows
  for all to authenticated
  using (private.has_any_building_role(array['manager']))
  with check (private.has_any_building_role(array['manager']));

-- Guest PII follows accessible bookings; a creator can see a not-yet-booked row.
drop policy if exists "guests: all" on public.guests;
create policy "guests: select" on public.guests for select to authenticated
  using (private.can_access_guest(id));
create policy "guests: insert" on public.guests for insert to authenticated
  with check (private.is_super_admin() or created_by = (select auth.uid()));
create policy "guests: update" on public.guests for update to authenticated
  using (private.can_access_guest(id))
  with check (private.can_access_guest(id));
create policy "guests: delete" on public.guests for delete to authenticated
  using (private.is_super_admin());

-- Booking agents can manage bookings, but physical deletion requires manager.
drop policy if exists "bookings: select" on public.bookings;
drop policy if exists "bookings: write" on public.bookings;
create policy "bookings: select" on public.bookings for select to authenticated
  using (private.can_access_building(building_id));
create policy "bookings: insert" on public.bookings for insert to authenticated
  with check (private.has_building_role(building_id, array['manager','staff','booking_agent']));
create policy "bookings: update" on public.bookings for update to authenticated
  using (private.has_building_role(building_id, array['manager','staff','booking_agent']))
  with check (private.has_building_role(building_id, array['manager','staff','booking_agent']));
create policy "bookings: delete" on public.bookings for delete to authenticated
  using (private.has_building_role(building_id, array['manager']));

drop policy if exists "room_rates: select" on public.room_rates;
drop policy if exists "room_rates: write" on public.room_rates;
create policy "room_rates: select" on public.room_rates for select to authenticated
  using (exists (
    select 1 from public.rooms r
    where r.id = room_id and private.can_access_building(r.building_id)
  ));
create policy "room_rates: write" on public.room_rates for all to authenticated
  using (exists (
    select 1 from public.rooms r
    where r.id = room_id and private.has_building_role(r.building_id, array['manager'])
  ))
  with check (exists (
    select 1 from public.rooms r
    where r.id = room_id and private.has_building_role(r.building_id, array['manager'])
  ));

drop policy if exists "room_blocks: all" on public.room_blocks;
create policy "room_blocks: select" on public.room_blocks for select to authenticated
  using (exists (
    select 1 from public.rooms r
    where r.id = room_id and private.can_access_building(r.building_id)
  ));
create policy "room_blocks: write" on public.room_blocks for all to authenticated
  using (exists (
    select 1 from public.rooms r
    where r.id = room_id and private.has_building_role(r.building_id, array['manager','staff'])
  ))
  with check (exists (
    select 1 from public.rooms r
    where r.id = room_id and private.has_building_role(r.building_id, array['manager','staff'])
  ));

drop policy if exists "payments: select" on public.payments;
drop policy if exists "payments: write" on public.payments;
create policy "payments: select" on public.payments for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and private.has_building_role(b.building_id, array['manager','staff'])
  ));
create policy "payments: write" on public.payments for all to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and private.has_building_role(b.building_id, array['manager','staff'])
  ))
  with check (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and private.has_building_role(b.building_id, array['manager','staff'])
  ));

drop policy if exists "booking_history: select" on public.booking_history;
drop policy if exists "booking_history: insert" on public.booking_history;
create policy "booking_history: select" on public.booking_history for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id and private.can_access_building(b.building_id)
  ));
create policy "booking_history: insert" on public.booking_history for insert to authenticated
  with check (
    changed_by = (select auth.uid())
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and private.can_access_building(b.building_id)
    )
  );

-- Old public helpers are no longer used by policies; keep them temporarily for
-- compatibility but remove anonymous execution.
revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.my_building_ids() from public, anon;
revoke execute on function public.has_building_role(uuid, text[]) from public, anon;

commit;
