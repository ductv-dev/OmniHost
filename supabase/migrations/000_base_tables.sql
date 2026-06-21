-- Baseline tables that predate the numbered booking migrations.
-- Kept idempotent so this can also be reconciled with an existing project.

create extension if not exists "uuid-ossp";

create table if not exists public.buildings (
  id                     uuid        primary key default gen_random_uuid(),
  name                   text        not null,
  sign_name              text,
  address                text        not null,
  map_link               text,
  gate_password          text,
  lobby_wifi_name        text,
  lobby_wifi_password    text,
  drinking_water_note    text,
  motorbike_parking_note text,
  custom_templates       jsonb       not null default '[]'::jsonb,
  created_at             timestamptz not null default now()
);

create table if not exists public.common_templates (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  category   text        not null,
  content    text        not null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_flows (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  items      jsonb       not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id                    uuid          primary key default gen_random_uuid(),
  building_id           uuid          not null references public.buildings(id) on delete cascade,
  room_number           text          not null,
  floor                 integer       not null,
  lockbox_password      text,
  wifi_name             text,
  wifi_password         text,
  washing_machine_floor integer,
  dryer_floor           integer,
  room_note             text,
  services              jsonb         not null default '{}'::jsonb,
  default_price         numeric(12,0) not null default 0,
  housekeeping          text          not null default 'ready',
  sort_order            integer       not null default 0,
  is_active             boolean       not null default true,
  created_at            timestamptz   not null default now()
);

create index if not exists idx_rooms_building on public.rooms (building_id);
