# PROJECT_MAP.md — Bản đồ cấu trúc dự án

## Cấu trúc thư mục

```
apps/
  api/      Fastify 5 — API dùng chung cho web và mobile (http://localhost:4000)
  web/      Next.js App Router — quản trị + tra cứu công khai (http://localhost:3000)
  mobile/   Expo Router (SDK 54) / React Native — bản mobile đầy đủ chức năng tương đương web, điều hướng dạng Tab bar
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
| `loans` | Mượn/trả (kể cả tạo hàng loạt qua giỏ hàng `/batch`), gia hạn, quá hạn — `LoanWithDetails` luôn kèm `copy.barcode` |
| `fines` | Danh sách phạt, thu tiền, miễn phạt — `FineWithDetails.loan` kèm `copy.barcode` để xác định đúng bản sao |
| `reports` | Tổng quan, sách mượn nhiều nhất, thống kê thời gian, độc giả mượn nhiều nhất |
| `notifications` | Gửi thông báo email (quá hạn...), cài đặt bật/tắt tự động — danh sách nhắc hạn/quá hạn trả kèm `barcode` bản sao |
| `settings` | Cài đặt thư viện (tên/logo/địa chỉ), mức phạt/ngày, tiền tố + **số thứ tự tiếp theo (dãy tuần tự)** mã vạch, **cấu hình sao lưu tự động + lịch sử sao lưu (list/create/download/delete/restore)** |
| `data-management` | Xóa hàng loạt dữ liệu theo loại — **mỗi loại yêu cầu gõ cụm từ xác nhận riêng + mật khẩu**, xem trước số lượng (`/counts`), nhật ký ai xóa gì lúc nào (`/logs`) |
| `old-system-import` | Nhập dữ liệu từ phần mềm thư viện cũ (sách/mã vạch/độc giả/lịch sử mượn-trả) — 2 nguồn: file Access `.accdb` (đọc theo đường dẫn trên máy chủ qua `apps/api/scripts/export-old-library-db.ps1` + OLEDB, chỉ QUAN_TRI, chỉ chạy được trên Windows) hoặc file Excel "Danh sách tổng quát" (chỉ có sách/mã vạch, mọi STAFF_ROLES). Hành vi **cộng thêm, bỏ qua trùng** (không xóa/ghi đè) — xem chi tiết thiết kế trong [HANDOFF.md](HANDOFF.md) |

`apps/api/src/lib/`: `uploads.ts` (avatar/cover/logo image save+delete), `password.ts` (argon2), `refresh-token.ts`, `barcode.ts` (kiểu sinh mã cũ dựa trên id sách — dùng làm fallback khi chưa cấu hình dãy tuần tự), `slugify.ts`, `mailer.ts`, `scheduler.ts` (`startNotificationScheduler` — nhắc quá hạn 7h sáng; `startBackupScheduler` — sao lưu tự động 3h sáng, cả hai đăng ký trong `server.ts`), `db-file.ts` (đọc/ghi file CSDL SQLite trực tiếp: `resolveDbFilePath`, `createSafetyBackup`, `listBackups`, `createLabeledBackup`, `pruneBackupsByLabel`, `applyRestoreBuffer`, `restoreFromBackupFile`, `getBackupFileBuffer`, `deleteBackupFile` — tất cả thao tác theo tên file đều qua `path.basename()` để chặn path traversal).

`apps/api/scripts/export-old-library-db.ps1` — script PowerShell dùng chung, đọc file Access của phần mềm cũ qua OLEDB (`Microsoft.ACE.OLEDB.16.0`/`12.0`), xuất JSON `{books, patrons, loans}`; được `old-system-import/access-reader.ts` gọi qua `child_process.execFile`. Yêu cầu cài "Microsoft Access Database Engine" trên máy chạy `thuvien-api` và chạy trên Windows.

## `apps/web/src/app/` — route theo nhóm (App Router)

```
(auth)/dang-nhap                      Đăng nhập
(public)/tra-cuu                      Tra cứu sách công khai (lưới bìa sách, không cần đăng nhập)
(public)/tra-cuu/[id]                 Chi tiết sách công khai
(dashboard)/tong-quan                 Tổng quan (dashboard theo role; độc giả có "membership card" navy + banner quá hạn + thẻ số liệu, đổi mật khẩu tự phục vụ qua Modal nút variant "gold")
(dashboard)/sach                      Quản lý sách (nhân viên: bảng danh sách; độc giả: lưới bìa sách qua `BookGridItem`)
(dashboard)/the-loai                  Quản lý thể loại
(dashboard)/tac-gia                   Quản lý tác giả
(dashboard)/ban-doc                   Quản lý độc giả (route giữ tên cũ "ban-doc", UI hiển thị "Độc giả")
(dashboard)/ban-doc/[id]              Sửa thông tin độc giả (avatar chữ nhật 2:3, đổi mật khẩu qua Modal, xóa vĩnh viễn)
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
(dashboard)/cai-dat/barcode           Tiền tố + số thứ tự tiếp theo (dãy tuần tự) mã vạch tự sinh
(dashboard)/cai-dat/nhap-du-lieu-cu   Nhập dữ liệu từ phần mềm cũ — mục Access (.accdb) chỉ hiện cho QUAN_TRI, mục Excel cho mọi STAFF_ROLES
(dashboard)/cai-dat/sao-luu           Sao lưu/Khôi phục — full trang 2 cột: cài đặt tự động + sao lưu ngay + khôi phục từ file (trái), lịch sử sao lưu (phải). Khôi phục yêu cầu gõ đúng "XÁC NHẬN"
(dashboard)/cai-dat/xoa-du-lieu       Xóa dữ liệu — 4 thẻ xóa theo loại + "Xóa tất cả", mỗi thao tác yêu cầu gõ cụm từ riêng + mật khẩu, xem trước số lượng, nhật ký xóa dữ liệu bên dưới
```

## `apps/mobile/app/` — Expo Router (SDK 54), điều hướng dạng Tab bar

```
_layout.tsx                           Root layout, bọc SafeAreaProvider
index.tsx, +not-found.tsx             Entry / màn hình không tìm thấy route
(auth)/dang-nhap                      Đăng nhập
(public)/tra-cuu/                     Tra cứu công khai — _layout.tsx (Stack) + index.tsx (lưới 2 cột) + [id].tsx (chi tiết)
(app)/_layout.tsx                     Tabs: Tổng quan · Mượn-trả (header navy riêng) · Sách · Độc giả (ẩn cho độc giả) · Thêm (ẩn cho độc giả)
(app)/them.tsx                        Tab "Thêm" — gộp Phạt/Báo cáo/Thể loại/Tác giả/Thông báo + Người dùng/Cài đặt (chỉ QUAN_TRI)
(app)/tong-quan.tsx                   Tổng quan theo role (giống web)
(app)/muon-tra.tsx                    Mượn/trả — Segmented 3 tab, PatronPicker dùng chung
(app)/sach/                           _layout.tsx (Stack) + index.tsx (lưới cho độc giả / bảng cho nhân viên) + [id].tsx (chi tiết + form sửa, UI kit mới) + moi.tsx (thêm sách — CHƯA redesign) + nhap-excel.tsx
(app)/ban-doc/                        _layout.tsx (Stack) + index.tsx + [id].tsx (sửa độc giả, full parity với web) + moi.tsx + nhap-excel.tsx
(app)/nguoi-dung/                     _layout.tsx (Stack) + index.tsx + [id].tsx + moi.tsx — chỉ QUAN_TRI
(app)/cai-dat/                        _layout.tsx (Stack) + index.tsx + các trang cài đặt con
(app)/phat.tsx, bao-cao.tsx, the-loai.tsx, tac-gia.tsx, thong-bao.tsx   Màn hình đơn (truy cập qua tab "Thêm")
```

`apps/mobile/components/ui/` — Button/Card/Badge/Segmented (UI kit dùng chung, bắt buộc cho mọi màn hình redesign — xem [CLAUDE.md](CLAUDE.md)). `apps/mobile/lib/theme.ts` — bảng màu `colors`. `apps/mobile/components/book-grid-item.tsx` — ô lưới bìa sách (tương ứng `apps/web/src/components/book-grid-item.tsx` bên web).

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

Models: `User`, `Patron`, `PatronType`, `RefreshToken`, `Category` (có `ddcPrefix` — dùng để khớp thể loại theo số DDC khi nhập dữ liệu cũ), `Author`, `Book`, `BookCopy`, `Loan`, `Fine`, `NotificationSettings`, `LibrarySettings`, `FineSettings`, `BarcodeSettings` (có `nextSequenceNumber` — khi khác NULL, mã vạch mới sinh theo dãy số tuần tự `${prefix}${7 chữ số}` thay vì kiểu cũ dựa trên id sách), `BackupSettings` (6 model settings này là singleton row, `id` cố định `"singleton"`), `DataDeletionLog` (nhật ký xóa dữ liệu — `actorId`/`actorName` lưu snapshot, không FK).

Không dùng Prisma enum (SQLite không hỗ trợ) — mọi trạng thái là `String`, ràng buộc ở tầng Zod. Comment enum hợp lệ được liệt kê ngay đầu file `schema.prisma`.

`prisma/seed.ts` — tài khoản mẫu cơ bản. `prisma/seed-test-data.ts` — sinh dữ liệu số lượng lớn để test (categories/authors/books/patrons/loans/fines).

## Tài khoản mẫu (sau khi seed)

- Thủ thư: `thuthu@cvpl.edu.vn` / `Admin@123`
- Độc giả: `CS001` hoặc `CS002` / `ChungSinh@123`
