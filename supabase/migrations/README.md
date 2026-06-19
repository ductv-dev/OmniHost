# Database Migrations — Hướng dẫn chạy

Chạy lần lượt trong **Supabase SQL Editor** (Dashboard → SQL Editor → New query).

## Thứ tự bắt buộc

| File | Nội dung | Phụ thuộc |
|---|---|---|
| `001_extend_rooms.sql` | Thêm cột `default_price`, `housekeeping`, `sort_order`, `is_active` vào `rooms` | — |
| `002_booking_tables.sql` | Enums, profiles, staff_assignments, guests, bookings, room_rates, room_blocks | 001 |
| `003_finance_tables.sql` | payments, booking_history | 002 |
| `004_rls_policies.sql` | Helper functions + toàn bộ RLS policies | 001–003 |

Mỗi script **idempotent** — chạy lại nhiều lần không bị lỗi.

## Sau khi chạy xong 004

Đánh dấu tài khoản hiện tại là super_admin. Chạy query này trong SQL Editor:

```sql
UPDATE public.profiles
SET is_super_admin = true
WHERE id = (
  SELECT id FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
);
```

## Sau khi migrate

Regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```
