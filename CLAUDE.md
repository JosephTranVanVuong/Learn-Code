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
- **Sinh mã vạch cho bản sao mới:** LUÔN gọi `allocateBarcodes(bookId, count, startIndex)` (`apps/api/src/modules/settings/service.ts`), không gọi thẳng `generateBarcode()` (`apps/api/src/lib/barcode.ts`). `allocateBarcodes` tự chọn giữa 2 kiểu: nếu `BarcodeSettings.nextSequenceNumber` khác NULL thì sinh theo dãy số tuần tự `${prefix}${7 chữ số}` (dùng để tiếp nối đúng dãy mã vạch cũ sau khi di trú dữ liệu) và tự tăng bộ đếm; ngược lại rơi về kiểu cũ dựa trên id sách. Đã áp dụng cho cả 3 nơi tạo bản sao (`books/import.ts`, `books/service.ts`, `copies/service.ts`).
- **Thao tác hàng loạt/atomic:** dùng `prisma.$transaction(async (tx) => {...})`, kiểm tra ràng buộc chính sách (vd. `maxActiveLoans`) cho **toàn bộ batch** trước khi ghi bất kỳ dòng nào — đảm bảo all-or-nothing (xem ví dụ `createLoansBatch` trong `apps/api/src/modules/loans/service.ts`).
- **Đổi mật khẩu tự phục vụ vs. admin đặt lại:** `changeOwnPassword` (auth/service.ts) yêu cầu xác minh mật khẩu hiện tại, dùng chung cho mọi role; khác với `resetPatronPassword`/`resetUserPassword` (admin thực hiện, không cần mật khẩu cũ, chỉ STAFF/ADMIN).
- **Component dùng chung trên web:** `Button`/`ButtonLink`/`Switch`/`Modal` (`apps/web/src/components/ui/`). `Modal` là overlay fixed-position, đóng bằng Escape hoặc click ra ngoài — tái sử dụng cho mọi popup dạng form (đổi mật khẩu, xác nhận khôi phục/xóa, v.v.) thay vì tự viết lại.
- **Giao diện:** theme "thư viện" navy `#0f1c3a` + vàng gold `#c9a24b`, STT đánh số theo hàng trong bảng danh sách.
- **Bố cục "full trang" cho trang thêm/sửa:** khi được yêu cầu bố cục full trang cho trang dạng form, dùng pattern `<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">` — cột trái `lg:col-span-1` (ảnh/preview/cài đặt phụ), cột phải `lg:col-span-2` (form chính, có thể chia nhiều card theo section). Đã áp dụng cho `sach/moi`, `sach/[id]`, `ban-doc/[id]`, `nguoi-dung/[id]`, `cai-dat/sao-luu`.
- **Thao tác phá hủy dữ liệu (xóa hàng loạt/khôi phục CSDL) phải có xác nhận gõ cụm từ chính xác:** hằng số cụm từ đặt trong `packages/shared/src/constants/index.ts` (vd. `RESTORE_CONFIRM_PHRASE`, `DELETE_ALL_CONFIRMATION_PHRASE`, `DELETE_*_CONFIRMATION_PHRASE`), viết HOA không dấu để gõ dễ, validate ở **cả hai phía** (Zod schema server-side + so sánh client-side để disable nút xác nhận). Với thao tác cực kỳ nguy hiểm (xóa hàng loạt, khôi phục CSDL), yêu cầu thêm nhập lại mật khẩu.
- **Nhật ký thao tác phá hủy (audit log):** model `DataDeletionLog` lưu `actorId`/`actorName` dạng snapshot string (KHÔNG dùng quan hệ khóa ngoại tới `User`) để nhật ký còn nguyên vẹn dù tài khoản thực hiện sau này bị xóa vĩnh viễn.
- **Sao lưu (`apps/api/src/lib/db-file.ts`):** mọi bản sao lưu (thủ công/tự động/an toàn trước thao tác nguy hiểm) đều là file `.db` trong `packages/database/prisma/backups/`, tên dạng `${label}-${isoTimestamp}.db`. Đọc/xóa file theo tên luôn phải qua `path.basename()` để chặn path traversal. Sao lưu tự động chạy qua `node-cron` trong `apps/api/src/lib/scheduler.ts` (đăng ký ở `server.ts`), cấu hình bật/tắt + số bản giữ lại nằm trong `BackupSettings` (singleton).
- **Import trực tiếp API client theo resource** (vd. `import { settingsApi } from "@/lib/resources"`) trong component trang là pattern đã có sẵn và được chấp nhận cho các thao tác không cần cache của React Query (tải file, v.v.) — không bắt buộc phải bọc mọi lời gọi API trong hook.
- **UI kit mobile** (`apps/mobile/components/ui/`): `Button` (variant primary/secondary/danger/ghost/success, size sm/md, `icon` là `keyof typeof Ionicons.glyphMap`, `loading` tự hiện `ActivityIndicator`), `Card` (khung bo góc viền xám), `Badge` (tone neutral/gold/success/danger), `Segmented` (tab nội trang generic `<T extends string>`). Theme màu tại `apps/mobile/lib/theme.ts` (object `colors`: `navy`/`navyLight`/`gold`/`goldBg`/`background`/`card`/`border`/`textPrimary`/`textSecondary`/`textMuted`/`danger*`/`success*`). **Mọi màn hình mobile được thiết kế lại từ nay về sau phải dùng bộ UI kit + theme này** thay vì hardcode màu/style trực tiếp như các màn hình cũ chưa được redesign.
- **Điều hướng mobile (`apps/mobile/app/(app)/_layout.tsx`):** `Tabs` (không phải `Stack` phẳng) với 5 tab hiển thị + tab "Thêm" gộp phần còn lại (Phạt/Báo cáo/Thể loại/Tác giả/Thông báo, + Người dùng/Cài đặt cho QUAN_TRI). Mọi thư mục có nhiều màn hình con (`sach/`, `ban-doc/`, `nguoi-dung/`, `cai-dat/`, `(public)/tra-cuu/`) **bắt buộc phải có `_layout.tsx` riêng** dạng `<Stack screenOptions={{headerShown:false}} />` — nếu thiếu, mỗi file con sẽ tự động biến thành 1 tab riêng ở ngoài cùng. Tab không cần icon trên thanh dưới cùng thì ẩn bằng `options={{href: null}}` trên `<Tabs.Screen>` (vẫn vào được qua `router.push`), có thể điều kiện theo role (`href: isStaff ? undefined : null`).
- **Ảnh đại diện độc giả (Patron, KHÔNG áp dụng cho User/nhân viên):** hình chữ nhật khổ dọc tỉ lệ 2:3 (`aspect-[2/3] rounded-md` trên web, `width`/`height` tỉ lệ 2:3 + `borderRadius` trên mobile) để giống style bìa sách, thay vì hình tròn trước đây.
- **Hiển thị "sách đang mượn" luôn phải kèm mã vạch (`copy.barcode`):** mọi nơi liệt kê loan/fine (Mượn/trả, Tổng quan, chi tiết độc giả, Phạt, Thông báo quá hạn) phải hiện mã vạch bản sao cạnh tên sách, để phân biệt chính xác cuốn nào trong nhiều bản sao cùng tên. `LoanWithDetails.copy.barcode` đã có sẵn; `FineWithDetails.loan.copy` và `DueSoonLoanItem`/`OverdueNotifyItem.barcode` phải được thêm thủ công vào Zod schema + service nếu thêm hiển thị mới ở nơi khác chưa có.
- **Phiên bản Expo SDK mobile hiện khóa ở SDK 54** (`expo: ~54.0.35`) để khớp với Expo Go client cài trên điện thoại thật của người dùng — **không tự ý nâng cấp Expo SDK** (kể cả khi có bản mới) trừ khi người dùng xác nhận lại phiên bản Expo Go họ đang dùng. Nếu cần đổi, dùng `npx expo install expo@^<version>.0.0 --fix` để tự động khớp toàn bộ dependency liên quan (react/react-native/expo-router/...), không tự sửa tay từng version trong `package.json`.
- **Xác minh thay đổi mobile (không có simulator/thiết bị thật trong sandbox):** `npx tsc --noEmit -p tsconfig.json` (type-check) + `npx expo export --platform ios --output-dir <thư mục tạm>` (build thật toàn bộ bundle qua Metro/Babel, bắt được lỗi route/import mà `tsc` bỏ sót) — luôn dọn `rm -rf` thư mục export tạm sau khi xong. Đây là cách xác minh **bắt buộc** cho mọi thay đổi chạm route, navigation, hoặc import mới trên mobile.

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
- **Nếu máy đang chạy `thuvien-api`/`thuvien-web` thường trực qua PM2 (đặc biệt kiểu Windows Service — xem `HUONG-DAN-CAI-DAT-LAN.txt` Phần 9.3):** lệnh `pm2 ...`/`taskkill` gõ từ phiên Claude Code sẽ báo `connect EPERM //./pipe/rpc.sock` hoặc `Access is denied` vì khác quyền tài khoản service — **không cố gắng escalate/bypass**, phải nhờ người dùng tự dừng/khởi động lại. `prisma migrate`/`prisma generate` cũng bị chặn cùng lý do (`EPERM ...query_engine-windows.dll.node`) khi service đó đang chạy — hỏi người dùng dừng service trước khi migrate schema, nhắc họ khởi động lại sau khi xong. Cổng 4000/3000 bị PM2 chiếm sẵn cũng khiến `pnpm dev` báo `EADDRINUSE` — không phải lỗi, dùng luôn service đó để `curl` verify thay vì cố chạy thêm 1 bản dev server.
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
- Khi không chắc về một quyết định thiết kế UI có nhiều phương án hợp lý, hỏi người dùng (đã dùng `AskUserQuestion` cho việc chọn trang riêng vs. modal khi thiết kế lại trang chi tiết sách, chọn bố cục tab cho mượn/trả, mức xác nhận cho sao lưu/xóa dữ liệu — xem [HANDOFF.md](HANDOFF.md)).
- Khi người dùng yêu cầu **"tư vấn"** một chức năng "chuẩn quốc tế": đọc code hiện tại trước để đánh giá có căn cứ (không đoán), nêu rõ khoảng trống so với chuẩn, rồi dùng `AskUserQuestion` để chốt 1-2 điểm rẽ nhánh quan trọng nhất trước khi code — không tự ý implement toàn bộ ngay khi chỉ được hỏi tư vấn.
- **Không bao giờ tự thực thi thật một thao tác phá hủy dữ liệu thật của người dùng để "kiểm tra"** (vd. xóa hàng loạt độc giả/sách thật, khôi phục đè lên dữ liệu hiện tại bằng bản cũ). Cách xác minh an toàn: (1) kiểm tra các cổng chặn (sai cụm từ/sai mật khẩu) trả lỗi đúng mà KHÔNG thực thi, (2) nếu cần xác minh luồng thành công, dùng chiêu "tự phục hồi bản vừa tạo lên chính nó" (self-restore no-op) thay vì phục hồi một bản cũ thật, rồi dọn sạch mọi bản ghi/file test đã tạo ra sau khi xong.
