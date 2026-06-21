# OmniHost — tiến độ triển khai

File này là checklist chính của dự án. Mỗi task chỉ được chuyển từ `[ ]` sang `[x]` sau khi đã triển khai và kiểm tra tương ứng.

## Đã hoàn thành

- [x] Chuyển các form nhập liệu trên mobile từ Drawer sang Dialog toàn màn hình.
- [x] Thêm lịch chọn ngày cho màn hình Hôm nay và cho phép xem theo ngày đã chọn.
- [x] Khởi tạo Supabase CLI và chuẩn hóa chuỗi migration local/production.
- [x] Sao lưu và thử khôi phục database trước khi hardening production.
- [x] Bật RLS cho toàn bộ bảng public.
- [x] Xây ma trận quyền theo tòa nhà: `manager`, `staff`, `booking_agent`.
- [x] Tách `super_admin` thành quyền toàn hệ thống, không dùng như vai trò theo tòa.
- [x] Chặn người dùng tự nâng quyền và chặn anonymous truy cập dữ liệu.
- [x] Bổ sung kiểm tra booking trùng lịch, phòng bị khóa, số tiền và audit history.
- [x] Reset dữ liệu nghiệp vụ production theo yêu cầu, giữ tài khoản và profile super admin.
- [x] Đồng bộ migration production đến `20260621070000`.
- [x] Tạo Server Actions quản trị nhân sự, có kiểm tra super admin ở phía máy chủ.
- [x] Tạo UI `/dashboard/access` cho super admin: mời nhân sự, gán nhiều tòa, đổi và gỡ quyền.
- [x] Ẩn menu Phân quyền với tài khoản không phải super admin.
- [x] Chạy 47/47 bài kiểm thử database, database lint, TypeScript và production build.

## Đang triển khai

- [x] Hoàn thiện UX màn hình Phân quyền: tìm kiếm, trạng thái rỗng, xác nhận thao tác nguy hiểm và hướng dẫn vai trò.
- [x] Sửa callback nhận lời mời để session được thiết lập ổn định trước khi đặt mật khẩu.
- [x] Cho phép tạo một nhân sự và gán nhiều tòa với vai trò riêng ngay trong form mời.
- [ ] Kiểm tra UI phân quyền trên kích thước mobile thực tế.

## Chưa làm

- [ ] Deploy code giao diện mới lên môi trường production của ứng dụng.
- [ ] Cập nhật Supabase Invite email template để đi qua `/auth/confirm` và gửi lại lời mời thử.
- [ ] Cấu hình và gửi thử email mời nhân sự qua SMTP production.
- [ ] Kiểm thử end-to-end bằng tài khoản thật cho từng vai trò.
- [ ] Ẩn/hiện các nút thao tác trong từng màn hình theo capability của vai trò; RLS hiện đã chặn ở database.
- [ ] Hoàn thiện quản lý thanh toán/doanh thu theo quyền `manager` và `staff`.
- [ ] Thêm CI bắt buộc chạy `pnpm typecheck`, `pnpm build`, database lint và pgTAP.
- [ ] Rà soát CSP, security headers, rate limit và nhật ký vận hành trước khi mở dùng rộng rãi.

## Quy ước cập nhật

- Task code chỉ đánh dấu hoàn thành khi typecheck/build hoặc test liên quan đã chạy thành công.
- Task production chỉ đánh dấu hoàn thành sau khi đã xác minh trực tiếp trên production.
- Nếu phát hiện lỗi mới, thêm vào phần `Chưa làm` trước khi bắt đầu sửa.
