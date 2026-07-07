# CLAUDE.md — Hướng dẫn cho Claude Code khi làm việc trong repo này

Dự án: **Thư viện Đại Chủng Viện Phaolô Lê Bảo Tịnh, Thanh Hóa** — hệ thống quản lý thư viện chạy local-first, gồm web + mobile dùng chung 1 API. Xem [PROJECT_MAP.md](PROJECT_MAP.md) để biết cấu trúc chi tiết, [CURRENT_PHASE.md](CURRENT_PHASE.md) để biết tính năng nào đã xong, [HANDOFF.md](HANDOFF.md) để biết trạng thái phiên làm việc gần nhất.

## Ngôn ngữ giao tiếp

Người dùng giao tiếp bằng **tiếng Việt**. Toàn bộ UI, i18n, thông báo lỗi, commit-style trong repo đều bằng tiếng Việt. Trả lời người dùng bằng tiếng Việt trừ khi họ chuyển sang tiếng Anh trước.

## Kiến trúc & quy ước bắt buộc phải tuân theo

- **Monorepo pnpm + Turborepo.** `apps/api` (Fastify 5), `apps/web` (Next.js App Router), `apps/mobile` (Expo Router / React Native), `packages/database` (Prisma + SQLite), `packages/shared` (Zod schemas, i18n, constants, API client dùng chung cho cả web lẫn mobile).
- **Không có enum trong Prisma** (SQLite không hỗ trợ) — mọi trường trạng thái (role, status...) là `String`, ràng buộc giá trị hợp lệ ở tầng Zod trong `packages/shared/src/schemas`. Khi thêm giá trị trạng thái mới, luôn cập nhật hằng số trong `packages/shared/src/constants/index.ts` + comment liệt kê enum ở đầu `schema.prisma`.
- **Vai trò (role):** `QUAN_TRI` (quản trị), `THU_THU` (thủ thư), `CONG_TAC_VIEN` (CTV — như thủ thư nhưng KHÔNG được xóa dữ liệu, KHÔNG đổi cài đặt thông báo, KHÔNG quản lý người dùng), `CHUNG_SINH` (độc giả — bảng `Patron`). Constants: `ROLES`, `STAFF_ROLES`, `DESTRUCTIVE_ROLES`, `ADMIN_ROLES`, `STAFF_ROLE_VALUES` trong `packages/shared/src/constants/index.ts`. **Không đổi các hằng số/ranh giới quyền này trừ khi được yêu cầu rõ ràng.**
- **"Chủng sinh" vs "Độc giả":** Tên hiển thị trên UI đã đổi từ "Chủng sinh" thành "Độc giả" (menu, label, thông báo lỗi...). Nhưng các định danh nội bộ trong code **giữ nguyên**: model Prisma `Patron`, hằng role `"CHUNG_SINH"`, tên hàm/biến, thư mục route `ban-doc`. Đây là quyết định có chủ ý — chỉ đổi text hiển thị, không đổi code plumbing. Ngoại lệ: `vi.settings.patronTypesDesc` cố ý giữ "Chủng sinh" làm ví dụ tên loại độc giả.
- **Auth:** JWT access token (~15 phút) + refresh token (~30 ngày, lưu DB để revoke được, hash trong `RefreshToken`). Web lưu refresh token trong cookie httpOnly; mobile lưu trong Expo SecureStore. Cả hai gửi access token qua header `Authorization: Bearer` — server không phân nhánh theo platform.
- **i18n (`packages/shared/src/i18n/vi.ts`):** chỉ chứa chuỗi tĩnh (plain string), **không dùng cú pháp placeholder/templating** (không có `"{count}"` interpolation). Ghép chuỗi động bằng nối chuỗi trực tiếp trong component, ví dụ `` `${n} ${vi.loan.cartBookCountSuffix}` ``.
- **Upload ảnh** (avatar độc giả/người dùng, bìa sách, logo thư viện): dùng chung `apps/api/src/lib/uploads.ts` (`saveAvatarImage`/`deleteAvatarImageFile`/`saveCoverImage`/`deleteCoverImageFile`/`saveLogoImage`/`deleteLogoImageFile`/`isAllowedImageMime`). File đặt tên UUID, không có thư mục con theo entity (tránh trùng tên).
- **Thao tác hàng loạt/atomic:** dùng `prisma.$transaction(async (tx) => {...})`, kiểm tra ràng buộc chính sách (vd. `maxActiveLoans`) cho **toàn bộ batch** trước khi ghi bất kỳ dòng nào — đảm bảo all-or-nothing (xem ví dụ `createLoansBatch` trong `apps/api/src/modules/loans/service.ts`).
- **Đổi mật khẩu tự phục vụ vs. admin đặt lại:** `changeOwnPassword` (auth/service.ts) yêu cầu xác minh mật khẩu hiện tại, dùng chung cho mọi role; khác với `resetPatronPassword`/`resetUserPassword` (admin thực hiện, không cần mật khẩu cũ, chỉ STAFF/ADMIN).
- **Component dùng chung trên web:** `Button`/`ButtonLink`/`Switch`/`Modal` (`apps/web/src/components/ui/`). `Modal` là overlay fixed-position, đóng bằng Escape hoặc click ra ngoài — tái sử dụng cho mọi popup dạng form (đổi mật khẩu, v.v.) thay vì tự viết lại.
- **Giao diện:** theme "thư viện" navy `#0f1c3a` + vàng gold `#c9a24b`, STT đánh số theo hàng trong bảng danh sách.

## Quy trình dev trên Windows (đọc kỹ trước khi đổi schema Prisma)

- Trước khi chạy `pnpm --filter @thuvien/database db:migrate`, **phải kill tiến trình `turbo run dev` đang chạy trước**, nếu không sẽ gặp lỗi `EPERM` do `tsx watch` giữ lock file Prisma query-engine `.dll.node`:
  ```bash
  powershell "Get-CimInstance Win32_Process | Where-Object {\$_.CommandLine -like '*turbo run dev*'}"
  taskkill //PID <id> //T //F
  ```
- Khởi động lại dev server ở background rồi poll cho tới khi sẵn sàng:
  ```bash
  (pnpm dev > /tmp/dev-server.log 2>&1 &)
  curl http://localhost:4000/health   # poll tới khi trả 200
  ```
- Dev server hay bị "stale"/không phản hồi giữa các lượt làm việc dài — nếu `curl` trả lỗi kết nối, kill lại tiến trình `turbo run dev` (có thể báo "process not found" nếu đã chết sẵn) rồi khởi động lại như trên.
- **Đường dẫn `/tmp/...` trong Git-Bash khác với cách Node-on-Windows resolve nó** (Node hiểu là `D:\tmp\...`). Khi cần tạo file tạm để test qua `node -e`, truyền đường dẫn Windows dùng dấu `/` qua `process.argv` thay vì hard-code `/tmp/...` trong script.
- Môi trường sandbox này **không có `chromium-cli`/`playwright`** — không thể tự chụp ảnh xác nhận UI. Xác minh thay đổi giao diện bằng: build thành công (`pnpm --filter @thuvien/web build`) + `curl` kiểm tra route trả 200 + type-check mobile (`npx tsc --noEmit`). Luôn nói rõ giới hạn này với người dùng khi báo cáo việc UI đã xong, và đề nghị họ tự kiểm tra bằng mắt tại URL cụ thể.

## Lệnh hay dùng

```bash
pnpm install
pnpm setup              # install + db:generate + db:migrate + db:seed
pnpm dev                # chạy song song API :4000, Web :3000, Expo dev server
pnpm --filter @thuvien/api build
pnpm --filter @thuvien/web build
pnpm --filter @thuvien/database db:migrate --name <ten_migration>
```

## Nguyên tắc làm việc

- Thực hiện đúng scope của từng yêu cầu — không tự ý mở rộng, không refactor ngoài phạm vi được hỏi.
- Sau mỗi thay đổi chạm tới backend, xác minh bằng build + gọi thử API thật (curl), không chỉ dựa vào type-check.
- Khi đổi schema Prisma, luôn tạo migration thật (không sửa tay DB), và nhớ quy trình kill-dev-server ở trên.
- Khi không chắc về một quyết định thiết kế UI có nhiều phương án hợp lý, hỏi người dùng (đã dùng `AskUserQuestion` cho việc chọn trang riêng vs. modal khi thiết kế lại trang chi tiết sách — xem [HANDOFF.md](HANDOFF.md)).
