-- ================================================================
-- OmniHost — migrate.sql
-- Tạo toàn bộ schema từ đầu. Chạy sau reset.sql trên DB trống.
--
-- SAU KHI CHẠY XONG, user đầu tiên đã đăng ký sẽ được tự động
-- đặt làm super_admin — không cần chạy thêm SQL thủ công.
-- ================================================================

-- ================================================================
-- EXTENSIONS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ================================================================
-- ENUMS
-- ================================================================

CREATE TYPE public.booking_source AS ENUM
  ('airbnb', 'booking', 'agoda', 'direct', 'facebook', 'tiktok');

CREATE TYPE public.booking_status AS ENUM
  ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');

CREATE TYPE public.guest_type AS ENUM ('short_stay', 'long_stay');

CREATE TYPE public.guest_gender AS ENUM ('male', 'female', 'other');

-- ================================================================
-- TABLES
-- ================================================================

-- buildings
CREATE TABLE public.buildings (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text        NOT NULL,
  sign_name             text,
  address               text        NOT NULL,
  map_link              text,
  gate_password         text,
  lobby_wifi_name       text,
  lobby_wifi_password   text,
  drinking_water_note   text,
  motorbike_parking_note text,
  custom_templates      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- common_templates
CREATE TABLE public.common_templates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  category   text        NOT NULL,
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- message_flows
CREATE TABLE public.message_flows (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  items      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- rooms
CREATE TABLE public.rooms (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id          uuid          NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  room_number          text          NOT NULL,
  floor                integer       NOT NULL,
  lockbox_password     text,
  wifi_name            text,
  wifi_password        text,
  washing_machine_floor integer,
  dryer_floor          integer,
  room_note            text,
  services             jsonb         NOT NULL DEFAULT '{}'::jsonb,
  default_price        numeric(12,0) NOT NULL DEFAULT 0,
  housekeeping         text          NOT NULL DEFAULT 'ready'
                         CHECK (housekeeping IN ('clean', 'dirty', 'cleaning', 'ready')),
  sort_order           integer       NOT NULL DEFAULT 0,
  is_active            boolean       NOT NULL DEFAULT true,
  created_at           timestamptz   NOT NULL DEFAULT now()
);

-- profiles (mở rộng auth.users)
CREATE TABLE public.profiles (
  id             uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text    NOT NULL,
  phone          text,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- staff_assignments
CREATE TABLE public.staff_assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  building_id uuid        NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  role        text        NOT NULL
                CHECK (role IN ('super_admin', 'manager', 'staff', 'booking_agent')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, building_id)
);

-- guests
CREATE TABLE public.guests (
  id         uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text               NOT NULL,
  phone      text,
  email      text,
  gender     public.guest_gender,
  country    text,
  note       text,
  created_at timestamptz        NOT NULL DEFAULT now()
);

-- bookings
CREATE TABLE public.bookings (
  id             uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id    uuid                  NOT NULL REFERENCES public.buildings(id),
  room_id        uuid                  NOT NULL REFERENCES public.rooms(id),
  guest_id       uuid                  REFERENCES public.guests(id),
  source         public.booking_source NOT NULL DEFAULT 'direct',
  status         public.booking_status NOT NULL DEFAULT 'confirmed',
  guest_type     public.guest_type     NOT NULL DEFAULT 'short_stay',
  check_in       date                  NOT NULL,
  check_out      date                  NOT NULL,
  check_in_time  time                  NOT NULL DEFAULT '14:00',
  check_out_time time                  NOT NULL DEFAULT '12:00',
  num_adults     integer               NOT NULL DEFAULT 1,
  num_children   integer               NOT NULL DEFAULT 0,
  total_price    numeric(12,0)         NOT NULL DEFAULT 0,
  deposit_paid   numeric(12,0)         NOT NULL DEFAULT 0,
  note           text,
  created_by     uuid                  REFERENCES public.profiles(id),
  created_at     timestamptz           NOT NULL DEFAULT now(),
  updated_at     timestamptz           NOT NULL DEFAULT now(),
  CONSTRAINT bookings_dates_check CHECK (check_out > check_in)
);

-- Chống trùng phòng tầng DB: 2 booking không được đè ngày trên cùng phòng
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status <> 'cancelled');

-- room_rates (giá override theo ngày)
CREATE TABLE public.room_rates (
  id      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid          NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date    date          NOT NULL,
  price   numeric(12,0) NOT NULL,
  UNIQUE (room_id, date)
);

-- room_blocks (khóa phòng)
CREATE TABLE public.room_blocks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid        NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_date date        NOT NULL,
  end_date   date        NOT NULL,
  reason     text,
  created_by uuid        REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_blocks_dates_check CHECK (end_date > start_date)
);

ALTER TABLE public.room_blocks
  ADD CONSTRAINT room_blocks_no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  );

-- payments
CREATE TABLE public.payments (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid          NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount     numeric(12,0) NOT NULL,
  method     text          NOT NULL DEFAULT 'cash'
               CHECK (method IN ('cash', 'bank_transfer', 'card', 'momo', 'other')),
  paid_at    date          NOT NULL DEFAULT CURRENT_DATE,
  note       text,
  created_by uuid          REFERENCES public.profiles(id),
  created_at timestamptz   NOT NULL DEFAULT now()
);

-- booking_history (audit log)
CREATE TABLE public.booking_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action     text        NOT NULL
               CHECK (action IN ('created', 'updated', 'cancelled', 'deleted')),
  changes    jsonb,
  changed_by uuid        REFERENCES public.profiles(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX idx_rooms_building          ON public.rooms (building_id);
CREATE INDEX idx_bookings_room           ON public.bookings (room_id);
CREATE INDEX idx_bookings_building       ON public.bookings (building_id);
CREATE INDEX idx_bookings_dates          ON public.bookings (check_in, check_out);
CREATE INDEX idx_bookings_status         ON public.bookings (status);
CREATE INDEX idx_bookings_guest          ON public.bookings (guest_id);
CREATE INDEX idx_room_rates_lookup       ON public.room_rates (room_id, date);
CREATE INDEX idx_room_blocks_room        ON public.room_blocks (room_id, start_date, end_date);
CREATE INDEX idx_staff_user              ON public.staff_assignments (user_id);
CREATE INDEX idx_staff_building          ON public.staff_assignments (building_id);
CREATE INDEX idx_payments_booking        ON public.payments (booking_id);
CREATE INDEX idx_payments_paid_at        ON public.payments (paid_at);
CREATE INDEX idx_booking_history_booking ON public.booking_history (booking_id);
CREATE INDEX idx_booking_history_time    ON public.booking_history (changed_at);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Tự tạo profile khi có auth user mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update bookings.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ================================================================
-- RLS HELPER FUNCTIONS
-- security definer để tránh đệ quy khi policies gọi lại profiles
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.my_building_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT building_id FROM public.staff_assignments WHERE user_id = auth.uid();
$$;

-- Trả về true nếu user là super_admin HOẶC có role trong tòa đó
CREATE OR REPLACE FUNCTION public.has_building_role(b_id uuid, required_roles text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.staff_assignments
      WHERE user_id     = auth.uid()
        AND building_id = b_id
        AND role        = ANY(required_roles)
    );
$$;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.buildings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_flows    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_rates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_history  ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- buildings: đọc → authenticated; ghi → super_admin
-- ----------------------------------------------------------------
CREATE POLICY "buildings: select" ON public.buildings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "buildings: insert" ON public.buildings
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

CREATE POLICY "buildings: update" ON public.buildings
  FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "buildings: delete" ON public.buildings
  FOR DELETE TO authenticated USING (public.is_super_admin());

-- ----------------------------------------------------------------
-- common_templates & message_flows: full CRUD → authenticated
-- ----------------------------------------------------------------
CREATE POLICY "common_templates: all" ON public.common_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "message_flows: all" ON public.message_flows
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- rooms: đọc → authenticated; ghi → super_admin hoặc manager của tòa
-- ----------------------------------------------------------------
CREATE POLICY "rooms: select" ON public.rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rooms: insert" ON public.rooms
  FOR INSERT TO authenticated
  WITH CHECK (public.has_building_role(building_id, ARRAY['manager']));

CREATE POLICY "rooms: update" ON public.rooms
  FOR UPDATE TO authenticated
  USING  (public.has_building_role(building_id, ARRAY['manager']))
  WITH CHECK (public.has_building_role(building_id, ARRAY['manager']));

CREATE POLICY "rooms: delete" ON public.rooms
  FOR DELETE TO authenticated
  USING (public.has_building_role(building_id, ARRAY['manager']));

-- ----------------------------------------------------------------
-- profiles: xem/sửa profile của chính mình; super_admin xem tất cả
-- ----------------------------------------------------------------
CREATE POLICY "profiles: select" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = auth.uid());

CREATE POLICY "profiles: insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "profiles: update" ON public.profiles
  FOR UPDATE TO authenticated
  USING  (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ----------------------------------------------------------------
-- staff_assignments: super_admin toàn quyền; user tự xem của mình
-- ----------------------------------------------------------------
CREATE POLICY "staff_assignments: select" ON public.staff_assignments
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR user_id = auth.uid());

CREATE POLICY "staff_assignments: write" ON public.staff_assignments
  FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ----------------------------------------------------------------
-- guests: full CRUD → authenticated (khách dùng chung giữa các tòa)
-- ----------------------------------------------------------------
CREATE POLICY "guests: all" ON public.guests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- bookings: theo tòa được giao; super_admin toàn quyền
-- ----------------------------------------------------------------
CREATE POLICY "bookings: select" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR building_id IN (SELECT public.my_building_ids())
  );

CREATE POLICY "bookings: write" ON public.bookings
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR building_id IN (SELECT public.my_building_ids())
  )
  WITH CHECK (
    public.is_super_admin()
    OR building_id IN (SELECT public.my_building_ids())
  );

-- ----------------------------------------------------------------
-- room_rates: xem → có trong tòa; ghi → manager+ của tòa đó
-- ----------------------------------------------------------------
CREATE POLICY "room_rates: select" ON public.room_rates
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND r.building_id IN (SELECT public.my_building_ids())
    )
  );

CREATE POLICY "room_rates: write" ON public.room_rates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND public.has_building_role(r.building_id, ARRAY['manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND public.has_building_role(r.building_id, ARRAY['manager'])
    )
  );

-- ----------------------------------------------------------------
-- room_blocks: theo tòa; super_admin toàn quyền
-- ----------------------------------------------------------------
CREATE POLICY "room_blocks: all" ON public.room_blocks
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND r.building_id IN (SELECT public.my_building_ids())
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND r.building_id IN (SELECT public.my_building_ids())
    )
  );

-- ----------------------------------------------------------------
-- payments: ẩn hoàn toàn với booking_agent; manager + staff xem/ghi
-- ----------------------------------------------------------------
CREATE POLICY "payments: select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND public.has_building_role(b.building_id, ARRAY['manager', 'staff'])
    )
  );

CREATE POLICY "payments: write" ON public.payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND public.has_building_role(b.building_id, ARRAY['manager', 'staff'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND public.has_building_role(b.building_id, ARRAY['manager', 'staff'])
    )
  );

-- ----------------------------------------------------------------
-- booking_history: xem theo tòa; ghi → authenticated (server action)
-- ----------------------------------------------------------------
CREATE POLICY "booking_history: select" ON public.booking_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (
          public.is_super_admin()
          OR b.building_id IN (SELECT public.my_building_ids())
        )
    )
  );

CREATE POLICY "booking_history: insert" ON public.booking_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ================================================================
-- BACKFILL
-- Tạo profile cho các auth user đã tồn tại trước khi chạy migrate,
-- sau đó đặt user đầu tiên (theo thứ tự đăng ký) làm super_admin.
-- ================================================================

INSERT INTO public.profiles (id, full_name)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles
SET is_super_admin = true
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- ================================================================
NOTIFY pgrst, 'reload schema';
