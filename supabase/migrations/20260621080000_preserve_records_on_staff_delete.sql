begin;

alter table public.bookings
  drop constraint if exists bookings_created_by_fkey,
  add constraint bookings_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.room_blocks
  drop constraint if exists room_blocks_created_by_fkey,
  add constraint room_blocks_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.payments
  drop constraint if exists payments_created_by_fkey,
  add constraint payments_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.booking_history
  drop constraint if exists booking_history_changed_by_fkey,
  add constraint booking_history_changed_by_fkey
    foreign key (changed_by) references public.profiles(id) on delete set null;

commit;
