-- ================================================================
-- 004 — Row Level Security: helpers + policies
-- Requires: 001, 002, 003 đã chạy
-- Safe to run multiple times (idempotent — dùng drop/create)
--
-- SAU KHI CHẠY SCRIPT NÀY:
-- Đánh dấu user hiện tại là super_admin:
--   UPDATE public.profiles SET is_super_admin = true
--   WHERE id = auth.uid();
-- (Chạy trong Supabase SQL Editor khi đang đăng nhập)
-- ================================================================

-- ================================================================
-- HELPER FUNCTIONS (security definer — tránh đệ quy RLS)
-- ================================================================

-- Kiểm tra user hiện tại có phải super_admin không
create or replace function public.is_super_admin()
returns boolean
language sql security definer stable
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Lấy danh sách building_id user được phân công
create or replace function public.my_building_ids()
returns setof uuid
language sql security definer stable
as $$
  select building_id
  from public.staff_assignments
  where user_id = auth.uid();
$$;

-- Kiểm tra user có role được yêu cầu trong tòa cụ thể không
-- Ví dụ: has_building_role(id, array['manager','staff'])
create or replace function public.has_building_role(b_id uuid, required_roles text[])
returns boolean
language sql security definer stable
as $$
  select public.is_super_admin()
    or exists (
      select 1 from public.staff_assignments
      where user_id     = auth.uid()
        and building_id = b_id
        and role        = any(required_roles)
    );
$$;

-- ================================================================
-- ENABLE RLS (các bảng mới; buildings/rooms/templates đã có từ trước)
-- ================================================================

alter table public.profiles          enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.guests            enable row level security;
alter table public.bookings          enable row level security;
alter table public.room_rates        enable row level security;
alter table public.room_blocks       enable row level security;
alter table public.payments          enable row level security;
alter table public.booking_history   enable row level security;

-- ================================================================
-- PROFILES
-- User tự xem/sửa profile của mình; super_admin xem tất cả
-- ================================================================

drop policy if exists "profiles: select"  on public.profiles;
drop policy if exists "profiles: update"  on public.profiles;
drop policy if exists "profiles: insert"  on public.profiles;

create policy "profiles: select" on public.profiles for select
  using (public.is_super_admin() or id = auth.uid());

create policy "profiles: update" on public.profiles for update
  using (id = auth.uid() or public.is_super_admin());

-- Trigger handle_new_user insert với security definer — không cần policy insert riêng
-- nhưng cần policy để service role insert khi user đăng ký
create policy "profiles: insert" on public.profiles for insert
  with check (id = auth.uid() or public.is_super_admin());

-- ================================================================
-- STAFF ASSIGNMENTS
-- Chỉ super_admin quản lý; user tự xem assignment của mình
-- ================================================================

drop policy if exists "staff_assignments: select" on public.staff_assignments;
drop policy if exists "staff_assignments: all"    on public.staff_assignments;

create policy "staff_assignments: select" on public.staff_assignments for select
  using (public.is_super_admin() or user_id = auth.uid());

create policy "staff_assignments: all" on public.staff_assignments
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ================================================================
-- GUESTS
-- Mọi user đăng nhập đều có thể xem/tạo/sửa khách (dùng chung)
-- ================================================================

drop policy if exists "guests: all" on public.guests;

create policy "guests: all" on public.guests
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ================================================================
-- BOOKINGS
-- Xem + ghi nếu thuộc tòa được giao (mọi role). Super_admin toàn quyền.
-- ================================================================

drop policy if exists "bookings: select" on public.bookings;
drop policy if exists "bookings: write"  on public.bookings;

create policy "bookings: select" on public.bookings for select
  using (
    public.is_super_admin()
    or building_id in (select public.my_building_ids())
  );

create policy "bookings: write" on public.bookings
  for all
  using (
    public.is_super_admin()
    or building_id in (select public.my_building_ids())
  )
  with check (
    public.is_super_admin()
    or building_id in (select public.my_building_ids())
  );

-- ================================================================
-- ROOM RATES
-- Xem nếu thuộc tòa. Ghi chỉ manager+ (không cho staff/agent đặt giá).
-- ================================================================

drop policy if exists "room_rates: select" on public.room_rates;
drop policy if exists "room_rates: write"  on public.room_rates;

create policy "room_rates: select" on public.room_rates for select
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.building_id in (select public.my_building_ids())
    )
  );

create policy "room_rates: write" on public.room_rates
  for all
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and public.has_building_role(r.building_id, array['manager'])
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and public.has_building_role(r.building_id, array['manager'])
    )
  );

-- ================================================================
-- ROOM BLOCKS
-- Theo tòa: xem + ghi nếu được phân công (staff+ trở lên)
-- ================================================================

drop policy if exists "room_blocks: all" on public.room_blocks;

create policy "room_blocks: all" on public.room_blocks
  for all
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.building_id in (select public.my_building_ids())
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.building_id in (select public.my_building_ids())
    )
  );

-- ================================================================
-- PAYMENTS
-- Ẩn hoàn toàn với booking_agent (không thấy doanh thu).
-- Chỉ manager + staff của tòa đó được xem/ghi.
-- ================================================================

drop policy if exists "payments: select" on public.payments;
drop policy if exists "payments: write"  on public.payments;

create policy "payments: select" on public.payments for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and public.has_building_role(b.building_id, array['manager', 'staff'])
    )
  );

create policy "payments: write" on public.payments
  for all
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and public.has_building_role(b.building_id, array['manager', 'staff'])
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and public.has_building_role(b.building_id, array['manager', 'staff'])
    )
  );

-- ================================================================
-- BOOKING HISTORY
-- Xem theo tòa của booking. Ghi: mọi user đã đăng nhập (từ server action).
-- ================================================================

drop policy if exists "booking_history: select" on public.booking_history;
drop policy if exists "booking_history: insert" on public.booking_history;

create policy "booking_history: select" on public.booking_history for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (
          public.is_super_admin()
          or b.building_id in (select public.my_building_ids())
        )
    )
  );

create policy "booking_history: insert" on public.booking_history for insert
  with check (auth.uid() is not null);
