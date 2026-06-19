-- ================================================================
-- 001 — Extend rooms table for booking management
-- Safe to run multiple times (idempotent)
-- ================================================================

alter table public.rooms
  add column if not exists default_price  numeric(12,0) not null default 0,
  add column if not exists housekeeping   text          not null default 'ready',
  add column if not exists sort_order     int           not null default 0,
  add column if not exists is_active      boolean       not null default true;

-- housekeeping values: 'clean' | 'dirty' | 'cleaning' | 'ready'
alter table public.rooms
  drop constraint if exists rooms_housekeeping_check;

alter table public.rooms
  add constraint rooms_housekeeping_check
  check (housekeeping in ('clean', 'dirty', 'cleaning', 'ready'));
