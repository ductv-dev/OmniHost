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

create table if not exists public.common_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.common_templates enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='common_templates' and policyname='Allow authenticated users to read common templates') then
    create policy "Allow authenticated users to read common templates" on public.common_templates for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='common_templates' and policyname='Allow authenticated users to insert common templates') then
    create policy "Allow authenticated users to insert common templates" on public.common_templates for insert to authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='common_templates' and policyname='Allow authenticated users to update common templates') then
    create policy "Allow authenticated users to update common templates" on public.common_templates for update to authenticated using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='common_templates' and policyname='Allow authenticated users to delete common templates') then
    create policy "Allow authenticated users to delete common templates" on public.common_templates for delete to authenticated using (true);
  end if;
end $$;

notify pgrst, 'reload schema';
