# OmniHost — Project Documentation

> Tài liệu kỹ thuật cho Claude Code và các AI assistant. Đọc toàn bộ trước khi code.
> Ngôn ngữ: tiếng Việt cho prose, tiếng Anh cho code/technical terms.

---

## 1. Tổng quan sản phẩm

**OmniHost** là hệ thống quản lý đặt phòng cho chuỗi căn hộ cho thuê ngắn/dài ngày tại Đà Nẵng. Phục vụ khách quốc tế đến từ nhiều kênh: Airbnb, Booking.com, Agoda, khách lẻ, Facebook, TikTok.

**Hai nhóm tính năng chính:**

| Nhóm | Mô tả | Trạng thái |
|---|---|---|
| Messaging | Sinh tin nhắn check-in từ template, quản lý flow gửi tin | ✅ Đã xây dựng |
| Booking Management | Lịch đặt phòng, CRUD booking, dashboard, phân quyền | 🚧 Đang xây dựng |

---

## 2. Tech Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Framework | Next.js 16 (App Router) | `app/` directory, RSC + Server Actions |
| Language | TypeScript strict | `tsconfig.json` đã cấu hình |
| Database | Supabase (PostgreSQL) | RLS bật toàn bộ |
| Auth | Supabase Auth (email/password) | Cookie-based session qua `@supabase/ssr` |
| UI Components | shadcn/ui (style: radix-nova) | Cấu hình trong `components.json` |
| Styling | Tailwind CSS v4 | Config via CSS, không dùng `tailwind.config.js` |
| Animations | Framer Motion v12 | Dùng cho micro-interactions (whileTap, spring) |
| Drawer / Sheet | vaul v1 | Bottom-sheet native feel |
| Date logic | date-fns v4 | KHÔNG dùng `new Date(string)` — lỗi timezone |
| Form | react-hook-form + zod | Validation ở client và server action |
| State / Cache | TanStack Query v5 | Client-side caching, calendar data |
| HTTP Client | Supabase JS v2 | Server client qua `@supabase/ssr` cookies |

---

## 3. Design System — iOS 26 Glassmorphism

**Nguyên tắc bất biến:**
- **Mobile-first.** Mọi UI phải dùng được một tay trên điện thoại. Desktop là bản mở rộng, thêm breakpoint `md:` sau.
- **Max container width:** `max-w-130` (520px) căn giữa, shadow `shadow-2xl` tạo depth.
- **Glass card:** `bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/20 shadow-xl`
- **Sticky room column:** `position: sticky; left: 0` với `bg-white/80 backdrop-blur-2xl`
- **Booking pills:** `bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-lg`
- **Drawer:** `rounded-t-[2rem]` + glassmorphism background
- **Tap targets:** tối thiểu 44×44px cho mọi interactive element
- **Scrollbar:** ẩn bằng `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
- **Spring animation:** `whileTap={{ scale: 0.95 }}` + `transition={{ type: 'spring', stiffness: 400, damping: 25 }}`

**Bottom nav (mobile):** 4 tab — Messages / Templates / Buildings / Calendar. `grid-cols-4`, `min-h-14`, `rounded-2xl`.

---

## 4. Database Schema

### 4.1 Bảng hiện có (messaging-focused)

```
buildings           — Tòa nhà + thông tin check-in (wifi, gate, templates)
  id, name, sign_name, address, map_link, gate_password,
  lobby_wifi_name, lobby_wifi_password, drinking_water_note,
  motorbike_parking_note, custom_templates (jsonb), created_at

rooms               — Phòng gắn với tòa
  id, building_id (→ buildings), room_number, floor,
  lockbox_password, wifi_name, wifi_password,
  washing_machine_floor, dryer_floor, room_note,
  services (jsonb), created_at

common_templates    — Template tin nhắn dùng chung
  id, name, category, content, created_at

message_flows       — Chuỗi template để gửi hàng loạt
  id, name, items (jsonb: [{source, template_id}]), created_at
```

**RLS hiện tại:** `authenticated` users có full CRUD trên mọi bảng (chưa phân role).

### 4.2 Bảng cần thêm (booking management — Phase 0)

> **Chiến lược: Extend, không Replace.** Giữ nguyên `buildings` và `rooms`. Thêm cột mới vào `rooms`. Thêm 8 bảng mới.

**Extend `rooms` (thêm cột):**
```sql
alter table rooms
  add column if not exists default_price  numeric(12,0) not null default 0,
  add column if not exists housekeeping   text          not null default 'ready',
  add column if not exists sort_order     int           not null default 0,
  add column if not exists is_active      boolean       not null default true;
-- housekeeping values: 'clean' | 'dirty' | 'cleaning' | 'ready'
-- buildings.id = rooms.building_id = "property" trong context booking
```

**Bảng mới:**
```
profiles            — Mở rộng auth.users
  id (→ auth.users), full_name, phone, is_super_admin, created_at

staff_assignments   — Phân công nhân viên ↔ tòa (nhiều-nhiều)
  id, user_id (→ profiles), building_id (→ buildings), role, created_at
  role values: 'super_admin' | 'manager' | 'staff' | 'booking_agent'
  UNIQUE (user_id, building_id)

guests              — Thông tin khách hàng
  id, full_name, phone, email, gender, country, note, created_at
  gender values: 'male' | 'female' | 'other'

bookings            — Đặt phòng (CORE)
  id, building_id (→ buildings), room_id (→ rooms), guest_id (→ guests),
  source, status, guest_type,
  check_in (date), check_out (date),
  check_in_time (time default '14:00'), check_out_time (time default '12:00'),
  num_adults, num_children,
  total_price numeric(12,0), deposit_paid numeric(12,0),
  note, created_by (→ profiles), created_at, updated_at
  CHECK (check_out > check_in)
  EXCLUDE USING GIST (room_id =, daterange(check_in, check_out, '[)') &&)
    WHERE status <> 'cancelled'
  source values: 'airbnb' | 'booking' | 'agoda' | 'direct' | 'facebook' | 'tiktok'
  status values: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
  guest_type values: 'short_stay' | 'long_stay'

room_rates          — Giá theo ngày (override default_price)
  id, room_id (→ rooms), date (date), price numeric(12,0)
  UNIQUE (room_id, date)

room_blocks         — Khóa phòng (không cho đặt)
  id, room_id (→ rooms), start_date (date), end_date (date),
  reason, created_by (→ profiles), created_at
  CHECK (end_date > start_date)
  EXCLUDE USING GIST (room_id =, daterange(start_date, end_date, '[)') &&)

payments            — Lịch sử thanh toán (nhiều lần / booking)
  id, booking_id (→ bookings), amount, method, paid_at (date), note,
  created_by (→ profiles), created_at
  method values: 'cash' | 'bank_transfer' | 'card' | 'momo' | 'other'

booking_history     — Audit log mọi thay đổi booking
  id, booking_id (→ bookings), action, changes (jsonb),
  changed_by (→ profiles), changed_at
  action values: 'created' | 'updated' | 'cancelled' | 'deleted'
```

**Migration scripts:** `supabase/migrations/` — đặt tên theo thứ tự `001_`, `002_`, ...

---

## 5. Quy tắc nghiệp vụ (bắt buộc tuân thủ)

### 5.1 Date / Timezone
- `check_in` / `check_out` kiểu `date` (KHÔNG `timestamp`). Tránh lỗi timezone với khách quốc tế.
- Booking từ 17→20 = ở 3 đêm: 17, 18, 19. Rời ngày 20 sáng.
- **Phòng "có khách" ngày D:** `check_in <= D AND check_out > D` (dùng `>`, KHÔNG `>=`).
- `daterange(check_in, check_out, '[)')` — half-open interval.
- KHÔNG tự parse date bằng `new Date(dateString)`. Dùng `date-fns` parse với format cụ thể.

### 5.2 Chống trùng phòng
- Tầng DB: GIST EXCLUDE constraint trên `bookings` (xem schema trên).
- Tầng frontend: query kiểm tra trước khi submit form, hiển thị lỗi rõ ràng.
- Booking `cancelled` không tham gia vào constraint (WHERE clause).

### 5.3 Tính giá
```sql
-- Tổng giá = tổng giá mỗi đêm trong khoảng ở
-- Mỗi đêm: room_rates.price nếu có, không thì rooms.default_price
SELECT sum(coalesce(rr.price, r.default_price))
FROM generate_series(:check_in, :check_out - interval '1 day', interval '1 day') d
CROSS JOIN rooms r
LEFT JOIN room_rates rr ON rr.room_id = r.id AND rr.date = d::date
WHERE r.id = :room_id;
```
- Tính realtime trên client khi user chọn phòng + ngày trong form.
- KHÔNG lưu cứng "còn lại" (remaining). Tính: `total_price - SUM(payments.amount)`.

### 5.4 Dashboard queries (quan trọng)
- **Check-in hôm nay:** `check_in = current_date AND status <> 'cancelled'`
- **Check-out hôm nay:** `check_out = current_date AND status <> 'cancelled'`
- **Doanh thu:** 2 cách — (a) phân bổ theo đêm (performance), (b) thực thu từ `payments` (cash flow). Hiển thị cả 2.
- **Công suất:** `count(phòng có khách ngày D) / count(is_active AND không bị block)`.

---

## 6. File Structure

### Hiện tại

```
app/
  login/                    # Auth (email/password)
  dashboard/
    layout.tsx              # Bottom nav (4 tab), sticky header, logout
    page.tsx                # Redirect → /buildings
    buildings/              # CRUD tòa nhà + custom templates
      [id]/                 # Chi tiết tòa: rooms-tab + templates-tab
    rooms/                  # CRUD phòng (list + new)
    templates/              # CRUD common_templates
    generator/              # Sinh tin nhắn check-in từ template
    calendar/               # Timeline calendar (mock data hiện tại)

components/
  ui/                       # shadcn: button, card, input, label, table
  calendar/
    TimelineCalendar.tsx    # CSS Grid timeline, vaul Drawer, mock data
  theme-provider.tsx
  query-provider.tsx
  service-worker-register.tsx

lib/
  supabase/
    server.ts               # createClient() cho Server Components + Actions
    client.ts               # createClient() cho Client Components
    middleware.ts           # Session refresh + route protection
  constants/
    templates.ts            # defaultTemplates, extractDynamicVariables, generateTemplateMessage
  utils.ts                  # cn() helper

types/
  supabase.ts               # Auto-generated từ Supabase CLI

supabase/
  schema.sql                # Schema hiện tại (buildings, rooms, templates, flows)
  reset.sql
  migrate-message-fields.sql
```

### Cần thêm (theo phase)

```
app/dashboard/
  bookings/
    page.tsx                # List bookings (filter theo ngày/phòng/status)
    new/page.tsx            # Form tạo booking
    [id]/page.tsx           # Chi tiết + sửa + xóa booking
  guests/
    page.tsx                # List + search khách
  calendar/
    page.tsx                # ← đã có, cần rewire sang real data + 3-tab mobile

components/
  booking/
    BookingForm.tsx         # Create/edit, Sheet (mobile) / Dialog (desktop)
    BookingDetail.tsx       # Chi tiết booking, payments, actions
    BookingCard.tsx         # Card dùng cho Today tab
    GuestFields.tsx         # Reusable guest info fields
  calendar/
    TimelineCalendar.tsx    # ← đã có, sẽ connect real data
    TodayView.tsx           # Check-in/out hôm nay list
    MonthCalendar.tsx       # Mobile month view (shadcn Calendar mở rộng)
    RoomTimeline.tsx        # Single-room timeline (mobile tab "Phòng")

lib/
  queries/
    bookings.ts             # fetchBookingsForCalendar, fetchTodayActivity, ...
    rooms.ts                # fetchRoomsWithRates, checkRoomAvailability
    dashboard.ts            # fetchOccupancy, fetchRevenue
  utils/
    dates.ts                # date helpers: nightsBetween, isOccupied, formatVN
    pricing.ts              # calculateBookingPrice (gọi Supabase generate_series)

supabase/
  migrations/
    001_extend_rooms.sql
    002_booking_tables.sql
    003_finance_tables.sql
    004_rls_policies.sql
```

---

## 7. Phân quyền (Role-Based Access)

> **Giai đoạn đầu (Phase 0–3):** chỉ có 1 user = super_admin. RLS policies vẫn phải đúng.
> **Giai đoạn sau (Phase 5):** bật UI phân quyền đầy đủ.

| Role | Tòa | Phòng/Giá | Booking | Doanh thu | Tài khoản |
|---|---|---|---|---|---|
| `super_admin` | Full | Full | Full | Full | Full |
| `manager` | Được giao | Full | Full | Xem | Không |
| `staff` | Được giao | Xem | Tạo/Sửa | Không | Không |
| `booking_agent` | Được giao | Không | Tạo/Sửa | Không | Không |

**RLS helpers** (security definer để tránh đệ quy):
- `is_super_admin()` → boolean
- `my_building_ids()` → setof uuid (từ staff_assignments)
- `has_building_role(building_id, roles[])` → boolean

---

## 8. Roadmap theo Phase

### Phase 0 — DB Migration
- [ ] Script `001_extend_rooms.sql`: thêm cột vào `rooms`
- [ ] Script `002_booking_tables.sql`: profiles, staff_assignments, guests, bookings, room_rates, room_blocks
- [ ] Script `003_finance_tables.sql`: payments, booking_history
- [ ] Script `004_rls_policies.sql`: helpers + policies
- [ ] Cài `btree_gist` extension (cần cho GIST constraint)
- [ ] Update `types/supabase.ts` sau khi migrate (`supabase gen types`)

### Phase 1 — Booking Core
- [ ] Guest CRUD (create khi tạo booking, edit từ list)
- [ ] `BookingForm.tsx`: chọn phòng, date range, guest info, source, pricing realtime
- [ ] Booking list (`/dashboard/bookings`) với filter
- [ ] Booking detail: xem payments, sửa, hủy
- [ ] Room blocks: form khóa phòng

### Phase 2 — Calendar Mobile (ưu tiên)
- [ ] Redesign `/dashboard/calendar/page.tsx` thành 3-tab layout (shadcn Tabs)
- [ ] Tab "Hôm nay": `TodayView.tsx` — check-in/out cards
- [ ] Tab "Lịch": `MonthCalendar.tsx` — month view + bottom sheet ngày
- [ ] Tab "Phòng": `RoomTimeline.tsx` — single room horizontal timeline
- [ ] Wire `TimelineCalendar.tsx` với real data từ Supabase

### Phase 3 — Dashboard
- [ ] Check-in/out hôm nay (count + list)
- [ ] Occupancy % theo tòa (thanh progress)
- [ ] Revenue cards (theo đêm + theo payments thực thu)

### Phase 4 — Pricing & Payments
- [ ] Room rates management UI (set giá theo ngày/khoảng ngày)
- [ ] Payment recording trong booking detail
- [ ] "Còn lại" calculation hiển thị realtime

### Phase 5 — Staff & Roles
- [ ] Profiles tự động tạo khi user đăng ký (Supabase trigger)
- [ ] Staff management UI (super_admin only)
- [ ] Staff assignments: gán tòa + role
- [ ] RLS enforcement trong UI (ẩn/hiện theo role)

### Phase 6 — Calendar Desktop
- [ ] Full timeline grid với `@tanstack/react-virtual` (virtualization bắt buộc)
- [ ] Sticky header (ngày) + sticky column (phòng)
- [ ] Màu booking theo `source` hoặc `status`
- [ ] Ô block phòng: xám + gạch chéo
- [ ] Responsive: mobile → 3 tab, `md:` → full grid

---

## 9. Code Conventions

### Server vs Client
- **Server Components** cho tất cả list/detail pages (fetch data trực tiếp, không loading state)
- **Client Components** cho: forms, calendar (cần state), interactive UI
- **Server Actions** cho mutations (create/update/delete). File `actions.ts` cạnh page.
- **TanStack Query** cho calendar data (cần invalidate, refetch khi booking thay đổi)

### Supabase
```typescript
// Server Component / Action
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client Component
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### Forms
- Dùng `react-hook-form` + `zod` schema
- Server actions nhận `FormData` cho simple forms
- Client-side submit + `useMutation` (TanStack Query) cho forms cần feedback realtime (pricing)

### Dates (quan trọng)
```typescript
import { format, parseISO, differenceInDays, eachDayOfInterval } from 'date-fns'

// ĐÚNG: parse từ DB date string
const date = parseISO('2026-06-20')  // trả về Date object lúc UTC midnight

// SAI: không dùng
const date = new Date('2026-06-20')  // lỗi timezone trên một số hệ thống

// Format về string để lưu DB
const dbDate = format(date, 'yyyy-MM-dd')
```

### Component patterns (mobile-first)
- **Form trên mobile:** `vaul Drawer` (bottom sheet) hoặc `Sheet` của shadcn
- **Dialog trên desktop:** `Dialog` của shadcn, kích hoạt tại breakpoint `md:`
- **Loading states:** Skeleton components, bắt buộc có cho mọi async fetch
- **Empty states:** text + CTA, KHÔNG bỏ trống
- **Error boundaries:** đã có `error.tsx`, dùng thêm toast cho mutation errors

### CSS / Tailwind
- Viết mobile base, thêm `md:` prefix cho desktop variations
- Glass: `bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl`
- Rounded: `rounded-[2rem]` cho card lớn, `rounded-2xl` cho pill/button nhỏ
- Không dùng arbitrary values cho spacing (dùng Tailwind scale)

---

## 10. Calendar — Chi tiết kỹ thuật

### TimelineCalendar (hiện tại)
- File: `components/calendar/TimelineCalendar.tsx`
- Flat CSS Grid: `gridTemplateColumns = "80px repeat(N, 48px)"`
- Mỗi element dùng `style={{ gridRow, gridColumn }}` explicit
- Booking pill: `gridColumn: "${startOffset + 2} / span ${nights}"`
  - `startOffset = differenceInDays(effectiveStart, monthStart)` (0-indexed)
  - `startCol = startOffset + 2` (+1 cho 1-indexed, +1 cho room name column)
- Sticky room column: `position: sticky; left: 0; z-index: 20`
- vaul `Drawer` cho booking detail

### Calendar Mobile (cần xây)
```
/dashboard/calendar
  └── Tabs (3 tabs)
      ├── "Hôm nay"  → TodayView (check-in/out lists)
      ├── "Lịch"     → MonthCalendar (shadcn Calendar + Drawer cho ngày)
      └── "Phòng"    → RoomTimeline (TimelineCalendar với 1 phòng)
```

### Calendar Desktop (Phase 6)
- `@tanstack/react-virtual` cho row + column virtualization
- Chỉ render rows/columns trong viewport
- Cần chạy tốt với 50+ phòng × 90 ngày

---

## 11. Environment & Setup

```bash
# Dev
pnpm dev

# Type check
pnpm typecheck

# Format
pnpm format

# Build
pnpm build
```

**Env vars cần có (`.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Lưu ý pnpm:** nếu gặp lỗi `ERR_PNPM_UNEXPECTED_STORE`, chạy:
```bash
pnpm install --config.confirmModulesPurge=false
```

---

## 12. Giới hạn & cảnh báo

- **Đồng bộ OTA (Airbnb/Booking/Agoda):** KHÔNG tự đồng bộ. Nhập tay. Đừng hứa sync tự động — cần channel manager riêng biệt.
- **RLS là tầng bảo mật duy nhất** vì frontend gọi thẳng Supabase. Test kỹ từng policy trước production.
- **Timezone:** chỉ dùng `date` (không `timestamp`) cho check-in/out. Giờ in/out lưu riêng kiểu `time`.
- **Không lưu "số tiền còn lại"** — luôn tính từ `payments`. Tránh lệch dữ liệu.
- **GIST constraint** cần extension `btree_gist`. Bật trước khi chạy migration bookings.
- **Virtualization bắt buộc** cho desktop timeline khi có 30+ phòng. Thiếu virtualization → lag nặng.
- **Booking agent** không thấy `payments` / doanh thu — enforce qua RLS (ẩn cả bảng), không chỉ ẩn trên UI.
