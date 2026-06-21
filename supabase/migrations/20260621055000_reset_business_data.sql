-- Intentional one-time reset approved before the first production rollout.
-- Keep auth.users and public.profiles so the existing super admin can still log in.

begin;

truncate table
  public.booking_history,
  public.payments,
  public.room_blocks,
  public.room_rates,
  public.bookings,
  public.guests,
  public.rooms,
  public.staff_assignments,
  public.buildings,
  public.message_flows,
  public.common_templates
restart identity cascade;

commit;
