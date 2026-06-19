-- ================================================================
-- 002 — Core booking tables
-- Requires: 001_extend_rooms.sql đã chạy
-- Safe to run multiple times (idempotent)
-- ================================================================

-- GIST exclude constraint cần extension này
create extension if not exists btree_gist;

-- ================================================================
-- ENUMS
-- ================================================================

do $$ begin
  create type public.booking_source as enum
    ('airbnb', 'booking', 'agoda', 'direct', 'facebook', 'tiktok');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum
    ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.guest_type as enum ('short_stay', 'long_stay');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.guest_gender as enum ('male', 'female', 'other');
exception when duplicate_object then null; end $$;

-- ================================================================
-- PROFILES
-- Mở rộng auth.users. Tự động tạo khi user đăng ký (trigger bên dưới).
-- ================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text        not null,
  phone         text,
  is_super_admin boolean   not null default false,
  created_at    timestamptz not null default now()
);

-- Trigger: tự tạo profile khi có auth user mới
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'User')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tạo profile cho các auth user đã tồn tại (chạy 1 lần)
insert into public.profiles (id, full_name)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', email, 'User')
from auth.users
on conflict (id) do nothing;

-- ================================================================
-- STAFF ASSIGNMENTS
-- Phân công nhân viên ↔ tòa (nhiều-nhiều).
-- role lưu dạng text (dễ extend, tránh phức tạp enum migration).
-- ================================================================

create table if not exists public.staff_assignments (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  building_id uuid        not null references public.buildings(id) on delete cascade,
  role        text        not null,
  created_at  timestamptz not null default now(),
  unique (user_id, building_id)
);

alter table public.staff_assignments
  drop constraint if exists staff_assignments_role_check;

alter table public.staff_assignments
  add constraint staff_assignments_role_check
  check (role in ('super_admin', 'manager', 'staff', 'booking_agent'));

-- ================================================================
-- GUESTS
-- ================================================================

create table if not exists public.guests (
  id         uuid        primary key default gen_random_uuid(),
  full_name  text        not null,
  phone      text,
  email      text,
  gender     public.guest_gender,
  country    text,
  note       text,
  created_at timestamptz not null default now()
);

-- ================================================================
-- BOOKINGS
-- ================================================================

create table if not exists public.bookings (
  id               uuid                   primary key default gen_random_uuid(),
  building_id      uuid                   not null references public.buildings(id),
  room_id          uuid                   not null references public.rooms(id),
  guest_id         uuid                   references public.guests(id),
  source           public.booking_source  not null default 'direct',
  status           public.booking_status  not null default 'confirmed',
  guest_type       public.guest_type      not null default 'short_stay',
  check_in         date                   not null,
  check_out        date                   not null,
  check_in_time    time                   not null default '14:00',
  check_out_time   time                   not null default '12:00',
  num_adults       int                    not null default 1,
  num_children     int                    not null default 0,
  total_price      numeric(12,0)          not null default 0,
  deposit_paid     numeric(12,0)          not null default 0,
  note             text,
  created_by       uuid                   references public.profiles(id),
  created_at       timestamptz            not null default now(),
  updated_at       timestamptz            not null default now(),
  constraint bookings_dates_check check (check_out > check_in)
);

-- Chống trùng phòng ở tầng DB (cốt lõi nhất)
-- Hai booking không được đè khoảng ngày trên cùng 1 phòng (trừ cancelled)
do $$ begin
  alter table public.bookings
    add constraint bookings_no_overlap
    exclude using gist (
      room_id with =,
      daterange(check_in, check_out, '[)') with &&
    ) where (status <> 'cancelled');
exception when duplicate_object then null; end $$;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- ROOM RATES
-- Giá theo ngày (override rooms.default_price).
-- Không có dòng cho ngày đó → dùng default_price của phòng.
-- ================================================================

create table if not exists public.room_rates (
  id      uuid          primary key default gen_random_uuid(),
  room_id uuid          not null references public.rooms(id) on delete cascade,
  date    date          not null,
  price   numeric(12,0) not null,
  unique (room_id, date)
);

-- ================================================================
-- ROOM BLOCKS
-- Khóa phòng: không cho đặt trong khoảng ngày này.
-- ================================================================

create table if not exists public.room_blocks (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references public.rooms(id) on delete cascade,
  start_date  date        not null,
  end_date    date        not null,
  reason      text,
  created_by  uuid        references public.profiles(id),
  created_at  timestamptz not null default now(),
  constraint room_blocks_dates_check check (end_date > start_date)
);

do $$ begin
  alter table public.room_blocks
    add constraint room_blocks_no_overlap
    exclude using gist (
      room_id with =,
      daterange(start_date, end_date, '[)') with &&
    );
exception when duplicate_object then null; end $$;

-- ================================================================
-- INDEXES
-- ================================================================

create index if not exists idx_bookings_dates      on public.bookings (check_in, check_out);
create index if not exists idx_bookings_room        on public.bookings (room_id);
create index if not exists idx_bookings_building    on public.bookings (building_id);
create index if not exists idx_bookings_status      on public.bookings (status);
create index if not exists idx_bookings_guest       on public.bookings (guest_id);
create index if not exists idx_room_rates_lookup    on public.room_rates (room_id, date);
create index if not exists idx_room_blocks_room     on public.room_blocks (room_id, start_date, end_date);
create index if not exists idx_staff_user           on public.staff_assignments (user_id);
create index if not exists idx_staff_building       on public.staff_assignments (building_id);
