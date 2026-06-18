-- ================================================================
-- OmniHost - Add message template data fields
-- Safe to run on an existing Supabase database.
-- ================================================================

alter table public.buildings
  add column if not exists sign_name text,
  add column if not exists map_link text,
  add column if not exists gate_password text,
  add column if not exists lobby_wifi_name text,
  add column if not exists lobby_wifi_password text,
  add column if not exists drinking_water_note text,
  add column if not exists motorbike_parking_note text,
  add column if not exists custom_templates jsonb default '[]'::jsonb;

alter table public.rooms
  add column if not exists lockbox_password text,
  add column if not exists wifi_name text,
  add column if not exists wifi_password text,
  add column if not exists washing_machine_floor integer,
  add column if not exists dryer_floor integer,
  add column if not exists room_note text,
  add column if not exists services jsonb default '{}'::jsonb;

notify pgrst, 'reload schema';
