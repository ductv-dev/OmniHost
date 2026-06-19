-- ================================================================
-- OmniHost — reset.sql
-- ⚠️  XÓA TOÀN BỘ DỮ LIỆU VÀ SCHEMA
-- Chạy file này trước khi chạy migrate.sql khi cần bắt đầu lại từ đầu.
-- ================================================================

-- Triggers
DROP TRIGGER IF EXISTS on_auth_user_created        ON auth.users;
DROP TRIGGER IF EXISTS bookings_set_updated_at     ON public.bookings;

-- Functions
DROP FUNCTION IF EXISTS public.handle_new_user()                  CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at()                   CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin()                   CASCADE;
DROP FUNCTION IF EXISTS public.my_building_ids()                  CASCADE;
DROP FUNCTION IF EXISTS public.has_building_role(uuid, text[])    CASCADE;

-- Tables (reverse dependency order)
DROP TABLE IF EXISTS public.booking_history  CASCADE;
DROP TABLE IF EXISTS public.payments         CASCADE;
DROP TABLE IF EXISTS public.room_blocks      CASCADE;
DROP TABLE IF EXISTS public.room_rates       CASCADE;
DROP TABLE IF EXISTS public.bookings         CASCADE;
DROP TABLE IF EXISTS public.guests           CASCADE;
DROP TABLE IF EXISTS public.staff_assignments CASCADE;
DROP TABLE IF EXISTS public.profiles         CASCADE;
DROP TABLE IF EXISTS public.rooms            CASCADE;
DROP TABLE IF EXISTS public.common_templates CASCADE;
DROP TABLE IF EXISTS public.message_flows    CASCADE;
DROP TABLE IF EXISTS public.buildings        CASCADE;

-- Enums
DROP TYPE IF EXISTS public.booking_source CASCADE;
DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.guest_type     CASCADE;
DROP TYPE IF EXISTS public.guest_gender   CASCADE;

NOTIFY pgrst, 'reload schema';
