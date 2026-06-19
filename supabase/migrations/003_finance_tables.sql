-- ================================================================
-- 003 — Finance tables: payments + booking_history
-- Requires: 002_booking_tables.sql đã chạy
-- Safe to run multiple times (idempotent)
-- ================================================================

-- ================================================================
-- PAYMENTS
-- Khách có thể trả nhiều lần (cọc, trả thêm, trả nốt).
-- Số tiền còn lại = bookings.total_price - SUM(payments.amount)
-- KHÔNG lưu "còn lại" cứng vào DB — tính ở query/frontend.
-- ================================================================

create table if not exists public.payments (
  id         uuid          primary key default gen_random_uuid(),
  booking_id uuid          not null references public.bookings(id) on delete cascade,
  amount     numeric(12,0) not null,
  method     text          not null default 'cash',
  paid_at    date          not null default current_date,
  note       text,
  created_by uuid          references public.profiles(id),
  created_at timestamptz   not null default now()
);

alter table public.payments
  drop constraint if exists payments_method_check;

alter table public.payments
  add constraint payments_method_check
  check (method in ('cash', 'bank_transfer', 'card', 'momo', 'other'));

-- ================================================================
-- BOOKING HISTORY
-- Audit log: ai sửa booking nào, lúc nào, đổi gì.
-- Ghi mỗi khi tạo / sửa / hủy / xóa booking.
-- ================================================================

create table if not exists public.booking_history (
  id         uuid        primary key default gen_random_uuid(),
  booking_id uuid        not null references public.bookings(id) on delete cascade,
  action     text        not null,
  changes    jsonb,
  changed_by uuid        references public.profiles(id),
  changed_at timestamptz not null default now()
);

alter table public.booking_history
  drop constraint if exists booking_history_action_check;

alter table public.booking_history
  add constraint booking_history_action_check
  check (action in ('created', 'updated', 'cancelled', 'deleted'));

-- ================================================================
-- INDEXES
-- ================================================================

create index if not exists idx_payments_booking        on public.payments (booking_id);
create index if not exists idx_payments_paid_at        on public.payments (paid_at);
create index if not exists idx_booking_history_booking on public.booking_history (booking_id);
create index if not exists idx_booking_history_time    on public.booking_history (changed_at);
