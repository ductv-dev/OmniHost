-- ================================================================
-- OmniHost - Database Schema
-- Safe to run multiple times (idempotent)
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================================
-- Tables
-- ================================================================

-- Create Buildings Table
create table if not exists public.buildings (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sign_name text,
  address text not null,
  map_link text,
  gate_password text,
  lobby_wifi_name text,
  lobby_wifi_password text,
  drinking_water_note text,
  motorbike_parking_note text,
  custom_templates jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.buildings
  add column if not exists sign_name text,
  add column if not exists map_link text,
  add column if not exists gate_password text,
  add column if not exists lobby_wifi_name text,
  add column if not exists lobby_wifi_password text,
  add column if not exists drinking_water_note text,
  add column if not exists motorbike_parking_note text,
  add column if not exists custom_templates jsonb default '[]'::jsonb;

-- Create Rooms Table
create table if not exists public.rooms (
  id uuid default uuid_generate_v4() primary key,
  building_id uuid references public.buildings(id) on delete cascade not null,
  room_number text not null,
  floor integer not null,
  lockbox_password text,
  wifi_name text,
  wifi_password text,
  washing_machine_floor integer,
  dryer_floor integer,
  room_note text,
  services jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.rooms
  add column if not exists lockbox_password text,
  add column if not exists wifi_name text,
  add column if not exists wifi_password text,
  add column if not exists washing_machine_floor integer,
  add column if not exists dryer_floor integer,
  add column if not exists room_note text,
  add column if not exists services jsonb default '{}'::jsonb;

-- ================================================================
-- Row Level Security
-- ================================================================

alter table public.buildings enable row level security;
alter table public.rooms enable row level security;

-- ================================================================
-- RLS Policies - Buildings
-- ================================================================

do $$ begin
  if not exists (select 1 from pg_policies where tablename='buildings' and policyname='Allow authenticated users to read buildings') then
    create policy "Allow authenticated users to read buildings" on public.buildings for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='buildings' and policyname='Allow authenticated users to insert buildings') then
    create policy "Allow authenticated users to insert buildings" on public.buildings for insert to authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='buildings' and policyname='Allow authenticated users to update buildings') then
    create policy "Allow authenticated users to update buildings" on public.buildings for update to authenticated using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='buildings' and policyname='Allow authenticated users to delete buildings') then
    create policy "Allow authenticated users to delete buildings" on public.buildings for delete to authenticated using (true);
  end if;
end $$;

-- ================================================================
-- RLS Policies - Rooms
-- ================================================================

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rooms' and policyname='Allow authenticated users to read rooms') then
    create policy "Allow authenticated users to read rooms" on public.rooms for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rooms' and policyname='Allow authenticated users to insert rooms') then
    create policy "Allow authenticated users to insert rooms" on public.rooms for insert to authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rooms' and policyname='Allow authenticated users to update rooms') then
    create policy "Allow authenticated users to update rooms" on public.rooms for update to authenticated using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rooms' and policyname='Allow authenticated users to delete rooms') then
    create policy "Allow authenticated users to delete rooms" on public.rooms for delete to authenticated using (true);
  end if;
end $$;
