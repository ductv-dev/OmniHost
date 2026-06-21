-- Emergency shield: policies existed remotely, but RLS itself was not enabled.
-- Keep the legacy authenticated behavior intact while removing all anon access.

begin;

alter table public.buildings          enable row level security;
alter table public.common_templates   enable row level security;
alter table public.message_flows      enable row level security;
alter table public.rooms              enable row level security;
alter table public.profiles           enable row level security;
alter table public.staff_assignments  enable row level security;
alter table public.guests             enable row level security;
alter table public.bookings           enable row level security;
alter table public.room_rates         enable row level security;
alter table public.room_blocks        enable row level security;
alter table public.payments           enable row level security;
alter table public.booking_history    enable row level security;

-- The split legacy migrations did not include policies for these four tables.
-- Recreate the current remote behavior so a clean local reset matches production.
drop policy if exists "buildings: select" on public.buildings;
drop policy if exists "buildings: insert" on public.buildings;
drop policy if exists "buildings: update" on public.buildings;
drop policy if exists "buildings: delete" on public.buildings;

create policy "buildings: select" on public.buildings
  for select to authenticated using (true);
create policy "buildings: insert" on public.buildings
  for insert to authenticated with check (public.is_super_admin());
create policy "buildings: update" on public.buildings
  for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy "buildings: delete" on public.buildings
  for delete to authenticated using (public.is_super_admin());

drop policy if exists "common_templates: all" on public.common_templates;
create policy "common_templates: all" on public.common_templates
  for all to authenticated using (true) with check (true);

drop policy if exists "message_flows: all" on public.message_flows;
create policy "message_flows: all" on public.message_flows
  for all to authenticated using (true) with check (true);

drop policy if exists "rooms: select" on public.rooms;
drop policy if exists "rooms: insert" on public.rooms;
drop policy if exists "rooms: update" on public.rooms;
drop policy if exists "rooms: delete" on public.rooms;

create policy "rooms: select" on public.rooms
  for select to authenticated using (true);
create policy "rooms: insert" on public.rooms
  for insert to authenticated
  with check (public.has_building_role(building_id, array['manager']));
create policy "rooms: update" on public.rooms
  for update to authenticated
  using (public.has_building_role(building_id, array['manager']))
  with check (public.has_building_role(building_id, array['manager']));
create policy "rooms: delete" on public.rooms
  for delete to authenticated
  using (public.has_building_role(building_id, array['manager']));

-- RLS is the primary guard. Explicit privilege removal adds defense in depth.
revoke all on table
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
from anon;

revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.my_building_ids() from public, anon;
revoke execute on function public.has_building_role(uuid, text[]) from public, anon;

grant execute on function public.is_super_admin() to authenticated, service_role;
grant execute on function public.my_building_ids() to authenticated, service_role;
grant execute on function public.has_building_role(uuid, text[]) to authenticated, service_role;

commit;
