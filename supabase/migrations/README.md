# Database migrations

Thư mục này là nguồn schema duy nhất của OmniHost. Không chạy lại
`supabase/migrate.sql` hoặc `supabase/reset.sql` trên production; hai file đó chỉ
được giữ tạm để đối chiếu lịch sử cho đến khi remote migration history đã được
reconcile.

## Thứ tự hiện tại

| File | Nội dung | Phụ thuộc |
|---|---|---|
| `000_base_tables.sql` | Các bảng nền có trước booking: buildings, rooms, common_templates, message_flows | — |
| `001_extend_rooms.sql` | Thêm cột `default_price`, `housekeeping`, `sort_order`, `is_active` vào `rooms` | — |
| `002_booking_tables.sql` | Enums, profiles, staff_assignments, guests, bookings, room_rates, room_blocks | 001 |
| `003_finance_tables.sql` | payments, booking_history | 002 |
| `004_rls_policies.sql` | Helper functions + toàn bộ RLS policies | 001–003 |

Các migration cũ được giữ idempotent để có thể đối chiếu với project hiện hữu.
Migration mới phải có tên timestamp dạng `YYYYMMDDHHMMSS_ten_thay_doi.sql` và
không được chỉnh sửa sau khi đã push lên production.

## Local workflow

```bash
pnpm db:start
pnpm db:reset
pnpm db:lint
pnpm db:test
```

`pnpm db:reset` phải dựng được database sạch chỉ từ migration và seed trong
repo. Không dùng SQL Editor làm nguồn thay đổi schema chính.

## Production gate

Trước mọi `supabase db push`:

1. Tạo và kiểm tra backup/restore trên staging.
2. Chạy `pnpm db:reset`, `pnpm db:lint`, `pnpm db:test`.
3. Xem lại migration diff và RLS policy với ít nhất hai user thuộc hai tòa khác nhau.
4. Chỉ link/push production sau khi có xác nhận rõ ràng.

Project hiện hữu có thể đã chạy SQL thủ công. Phải kiểm kê remote schema và dùng
`supabase migration repair` để reconcile lịch sử trước lần push đầu tiên; không
được giả định các file `000`–`004` đã có trong migration history.

## Khởi tạo super admin

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

## Sau khi thay đổi schema

Regenerate TypeScript types:

```bash
pnpm supabase gen types typescript --local > types/supabase.ts
```
