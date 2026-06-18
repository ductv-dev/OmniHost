-- Reset Database Script
-- ⚠️ WARNING: This will delete ALL data!

-- ================================================================
-- Step 1: Drop tables
-- ================================================================
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.buildings CASCADE;

-- ================================================================
-- Step 2: Recreate schema
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Buildings Table
create table public.buildings (
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

-- Create Rooms Table
create table public.rooms (
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

-- Enable Row Level Security (RLS)
alter table public.buildings enable row level security;
alter table public.rooms enable row level security;

-- Create Policies for Buildings (Authenticated Users Only)
create policy "Allow authenticated users to read buildings"
  on public.buildings for select
  to authenticated
  using (true);

create policy "Allow authenticated users to insert buildings"
  on public.buildings for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update buildings"
  on public.buildings for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users to delete buildings"
  on public.buildings for delete
  to authenticated
  using (true);

-- Create Policies for Rooms (Authenticated Users Only)
create policy "Allow authenticated users to read rooms"
  on public.rooms for select
  to authenticated
  using (true);

create policy "Allow authenticated users to insert rooms"
  on public.rooms for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update rooms"
  on public.rooms for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users to delete rooms"
  on public.rooms for delete
  to authenticated
  using (true);
