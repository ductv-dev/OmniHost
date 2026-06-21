begin;

alter table public.rooms
  add constraint rooms_id_building_unique unique (id, building_id);

alter table public.bookings
  drop constraint if exists bookings_room_id_fkey,
  add constraint bookings_room_building_fkey
    foreign key (room_id, building_id)
    references public.rooms(id, building_id);

alter table public.bookings
  add constraint bookings_adults_check check (num_adults >= 1),
  add constraint bookings_children_check check (num_children >= 0),
  add constraint bookings_total_price_check check (total_price >= 0),
  add constraint bookings_deposit_check check (deposit_paid >= 0 and deposit_paid <= total_price);

alter table public.room_rates
  add constraint room_rates_price_check check (price >= 0);

alter table public.payments
  add constraint payments_amount_check check (amount > 0);

create or replace function private.check_booking_room_blocks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'cancelled' then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.room_id::text, 0)
    );

    if exists (
      select 1
      from public.room_blocks rb
      where rb.room_id = new.room_id
        and daterange(rb.start_date, rb.end_date, '[)')
          && daterange(new.check_in, new.check_out, '[)')
    ) then
      raise exception 'Phòng đã bị khóa trong khoảng thời gian này'
        using errcode = '23P01';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.check_room_block_bookings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.room_id::text, 0)
  );

  if exists (
    select 1
    from public.bookings b
    where b.room_id = new.room_id
      and b.status <> 'cancelled'
      and daterange(b.check_in, b.check_out, '[)')
        && daterange(new.start_date, new.end_date, '[)')
  ) then
    raise exception 'Phòng đã có booking trong khoảng thời gian này'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_check_room_blocks on public.bookings;
create trigger bookings_check_room_blocks
  before insert or update of room_id, check_in, check_out, status
  on public.bookings
  for each row execute function private.check_booking_room_blocks();

drop trigger if exists room_blocks_check_bookings on public.room_blocks;
create trigger room_blocks_check_bookings
  before insert or update of room_id, start_date, end_date
  on public.room_blocks
  for each row execute function private.check_room_block_bookings();

alter table public.booking_history
  add column if not exists building_id uuid references public.buildings(id) on delete set null,
  add column if not exists booking_snapshot jsonb;

update public.booking_history h
set building_id = b.building_id
from public.bookings b
where b.id = h.booking_id and h.building_id is null;

alter table public.booking_history
  drop constraint if exists booking_history_booking_id_fkey;

create index if not exists idx_booking_history_building
  on public.booking_history(building_id, changed_at);

create or replace function private.audit_booking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
begin
  if tg_op = 'INSERT' then
    audit_action := 'created';
    insert into public.booking_history (
      booking_id, building_id, action, changes, booking_snapshot, changed_by
    ) values (
      new.id, new.building_id, audit_action,
      jsonb_build_object('after', to_jsonb(new)), to_jsonb(new), auth.uid()
    );
    return new;
  elsif tg_op = 'UPDATE' then
    audit_action := case
      when old.status <> 'cancelled' and new.status = 'cancelled' then 'cancelled'
      else 'updated'
    end;
    insert into public.booking_history (
      booking_id, building_id, action, changes, booking_snapshot, changed_by
    ) values (
      new.id, new.building_id, audit_action,
      jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)),
      to_jsonb(new), auth.uid()
    );
    return new;
  else
    insert into public.booking_history (
      booking_id, building_id, action, changes, booking_snapshot, changed_by
    ) values (
      old.id, old.building_id, 'deleted',
      jsonb_build_object('before', to_jsonb(old)), to_jsonb(old), auth.uid()
    );
    return old;
  end if;
end;
$$;

drop trigger if exists bookings_audit_change on public.bookings;
create trigger bookings_audit_change
  after insert or update or delete on public.bookings
  for each row execute function private.audit_booking_change();

drop policy if exists "booking_history: select" on public.booking_history;
drop policy if exists "booking_history: insert" on public.booking_history;
create policy "booking_history: select" on public.booking_history
  for select to authenticated
  using (building_id is not null and private.can_access_building(building_id));

revoke insert, update, delete on public.booking_history from authenticated;

commit;
