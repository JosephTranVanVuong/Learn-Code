# PROJECT_MAP.md — Bản đồ cấu trúc dự án

## Cấu trúc thư mục

```
apps/
  api/      Fastify 5 — API dùng chung cho web và mobile (http://localhost:4000)
  web/      Next.js App Router — quản trị + tra cứu công khai (http://localhost:3000)
  mobile/   Expo Router / React Native — bản mobile đầy đủ chức năng tương đương web
packages/
  database/ Prisma schema (SQLite) + migrations + seed dữ liệu mẫu
  shared/   Zod schemas, api-client, hằng số, từ điển tiếng Việt (i18n), React Query hooks dùng chung
  ui-tokens/    Tailwind config gốc dùng chung giữa web/mobile
  eslint-config/, tsconfig/   config dùng chung
```

## `apps/api/src/modules/` — các module API (mỗi module: `route.ts` + `service.ts`)

| Module | Chức năng |
|---|---|
| `auth` | login, refresh, logout, me, change-password (tự phục vụ), register |
| `users` | CRUD người dùng (nhân viên), vô hiệu hóa, xóa vĩnh viễn, avatar upload |
| `patrons` | CRUD độc giả, đặt lại mật khẩu, vô hiệu hóa, xóa vĩnh viễn, avatar upload, import Excel |
| `patron-types` | Loại độc giả (chính sách mượn: số sách tối đa/số ngày/số lần gia hạn) |
| `categories` | Thể loại sách |
| `authors` | Tác giả |
| `books` | CRUD sách + tra cứu công khai (không auth), cover image upload |
| `copies` | Bản sao sách (mã vạch, trạng thái, vị trí kệ) |
| `loans` | Mượn/trả (kể cả tạo hàng loạt qua giỏ hàng `/batch`), gia hạn, quá hạn |
| `fines` | Danh sách phạt, thu tiền, miễn phạt |
| `reports` | Tổng quan, sách mượn nhiều nhất, thống kê thời gian, độc giả mượn nhiều nhất |
| `notifications` | Gửi thông báo email (quá hạn...), cài đặt bật/tắt tự động |
| `settings` | Cài đặt thư viện (tên/logo/địa chỉ), mức phạt/ngày, tiền tố mã vạch, **cấu hình sao lưu tự động + lịch sử sao lưu (list/create/download/delete/restore)** |
| `data-management` | Xóa hàng loạt dữ liệu theo loại — **mỗi loại yêu cầu gõ cụm từ xác nhận riêng + mật khẩu**, xem trước số lượng (`/counts`), nhật ký ai xóa gì lúc nào (`/logs`) |

`apps/api/src/lib/`: `uploads.ts` (avatar/cover/logo image save+delete), `password.ts` (argon2), `refresh-token.ts`, `barcode.ts`, `slugify.ts`, `mailer.ts`, `scheduler.ts` (`startNotificationScheduler` — nhắc quá hạn 7h sáng; `startBackupScheduler` — sao lưu tự động 3h sáng, cả hai đăng ký trong `server.ts`), `db-file.ts` (đọc/ghi file CSDL SQLite trực tiếp: `resolveDbFilePath`, `createSafetyBackup`, `listBackups`, `createLabeledBackup`, `pruneBackupsByLabel`, `applyRestoreBuffer`, `restoreFromBackupFile`, `getBackupFileBuffer`, `deleteBackupFile` — tất cả thao tác theo tên file đều qua `path.basename()` để chặn path traversal).

## `apps/web/src/app/` — route theo nhóm (App Router)

```
(auth)/dang-nhap                      Đăng nhập
(public)/tra-cuu                      Tra cứu sách công khai (lưới bìa sách, không cần đăng nhập)
(public)/tra-cuu/[id]                 Chi tiết sách công khai
(dashboard)/tong-quan                 Tổng quan (dashboard theo role, đổi mật khẩu tự phục vụ cho độc giả)
(dashboard)/sach                      Quản lý sách
(dashboard)/the-loai                  Quản lý thể loại
(dashboard)/tac-gia                   Quản lý tác giả
(dashboard)/ban-doc                   Quản lý độc giả (route giữ tên cũ "ban-doc", UI hiển thị "Độc giả")
(dashboard)/ban-doc/[id]              Sửa thông tin độc giả (avatar, đổi mật khẩu qua Modal, xóa vĩnh viễn)
(dashboard)/ban-doc/nhap-excel        Import độc giả từ Excel
(dashboard)/sach/moi                  Thêm sách — full trang, upload ảnh bìa ngay lúc tạo, quay về /sach sau khi lưu
(dashboard)/sach/[id]                 Sửa thông tin sách — full trang 2 cột
(dashboard)/muon-tra                  Mượn/trả — 3 tab: "Cho mượn" (giỏ mượn), "Trả sách" (quét nhanh + giỏ trả theo độc giả), "Đang mượn" (bảng + gia hạn)
(dashboard)/phat                      Quản lý phạt
(dashboard)/bao-cao                   Báo cáo & thống kê (recharts)
(dashboard)/nguoi-dung                Quản lý người dùng (nhân viên) — chỉ QUAN_TRI
(dashboard)/nguoi-dung/[id]           Sửa thông tin người dùng (avatar, đổi mật khẩu qua Modal, xóa vĩnh viễn)
(dashboard)/thong-bao                 Thông báo email
(dashboard)/cai-dat                   Cài đặt hệ thống — chỉ QUAN_TRI
(dashboard)/cai-dat/sao-luu           Sao lưu/Khôi phục — full trang 2 cột: cài đặt tự động + sao lưu ngay + khôi phục từ file (trái), lịch sử sao lưu (phải). Khôi phục yêu cầu gõ đúng "XÁC NHẬN"
(dashboard)/cai-dat/xoa-du-lieu       Xóa dữ liệu — 4 thẻ xóa theo loại + "Xóa tất cả", mỗi thao tác yêu cầu gõ cụm từ riêng + mật khẩu, xem trước số lượng, nhật ký xóa dữ liệu bên dưới
```

`apps/mobile/app/(app)/` mirror cấu trúc trên (React Native), `(auth)` và `(public)` tương ứng.

## `packages/shared/src/`

```
schemas/      Zod schemas (auth, patron, user, book, loan, fine, ...) — nguồn sự thật duy nhất cho validation
constants/    ROLES, STAFF_ROLES, DESTRUCTIVE_ROLES, ADMIN_ROLES, STAFF_ROLE_VALUES, COPY/LOAN/FINE_STATUSES
i18n/vi.ts    Toàn bộ chuỗi tiếng Việt hiển thị trên UI (không dùng placeholder templating)
api/          API client theo resource (auth.ts, users.ts, loans.ts, patrons.ts, books.ts, ...)
api-client/   HTTP client lõi (fetch wrapper, ApiError)
hooks/        (nếu có) React Query hooks dùng chung
types/        Type phụ trợ
```

## Database (`packages/database/prisma/schema.prisma`)

Models: `User`, `Patron`, `PatronType`, `RefreshToken`, `Category`, `Author`, `Book`, `BookCopy`, `Loan`, `Fine`, `NotificationSettings`, `LibrarySettings`, `FineSettings`, `BarcodeSettings`, `BackupSettings` (6 model settings này là singleton row, `id` cố định `"singleton"`), `DataDeletionLog` (nhật ký xóa dữ liệu — `actorId`/`actorName` lưu snapshot, không FK).

Không dùng Prisma enum (SQLite không hỗ trợ) — mọi trạng thái là `String`, ràng buộc ở tầng Zod. Comment enum hợp lệ được liệt kê ngay đầu file `schema.prisma`.

`prisma/seed.ts` — tài khoản mẫu cơ bản. `prisma/seed-test-data.ts` — sinh dữ liệu số lượng lớn để test (categories/authors/books/patrons/loans/fines).

## Tài khoản mẫu (sau khi seed)

- Thủ thư: `thuthu@cvpl.edu.vn` / `Admin@123`
- Độc giả: `CS001` hoặc `CS002` / `ChungSinh@123`
