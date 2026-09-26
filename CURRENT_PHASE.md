# CURRENT_PHASE.md — Trạng thái tính năng hiện tại

Cập nhật lần cuối: 2026-09-20

## Đã hoàn thành (nền tảng, các phiên trước)

- Scaffold monorepo (pnpm + Turborepo), Prisma schema + seed, API auth đầy đủ (login/refresh/logout/me + JWT + phân quyền theo role).
- CRUD danh mục sách: thể loại, tác giả, sách, bản sao (mã vạch, trạng thái, vị trí kệ). Trang tra cứu công khai.
- CRUD độc giả (Patron), loại độc giả (chính sách mượn), import Excel.
- Mượn/trả sách, gia hạn, quá hạn tự động, tính phạt trễ hạn, thu tiền/miễn phạt.
- Báo cáo & thống kê (web: recharts; mobile: thẻ số liệu + thanh tỷ lệ).
- Cài đặt hệ thống (thông tin thư viện, mức phạt/ngày, tiền tố mã vạch, bật/tắt gửi email tự động), quản lý người dùng nhân viên (QUAN_TRI/THU_THU/CONG_TAC_VIEN).
- Web và mobile có chức năng tương đương nhau, dùng chung 1 API.

## Đã hoàn thành trong phiên gần đây (arc "Chủng sinh→Độc giả" đến "Tra cứu sách")

1. Dữ liệu test số lượng lớn qua `seed-test-data.ts` (25 thể loại/25 tác giả/25 sách/22 độc giả/lượt mượn/phạt).
2. Đổi tên hiển thị "Chủng sinh" → "Độc giả" toàn UI, giữ nguyên định danh code (model `Patron`, role `"CHUNG_SINH"`, route `ban-doc`).
3. Xóa vĩnh viễn người dùng (cạnh nút Vô hiệu hóa).
4. Giỏ hàng mượn sách (batch loan atomic qua `POST /loans/batch`).
5. Thiết kế lại full trang: "Sửa thông tin độc giả", "Sửa thông tin người dùng" (+ thêm avatar upload cho User — migration `avatarUrl`).
6. Đổi mật khẩu tự phục vụ cho độc giả trên Tổng quan (`POST /auth/change-password`).
7. Thiết kế lại "Tra cứu sách" công khai theo chuẩn OPAC: `/tra-cuu` lưới bìa sách, `/tra-cuu/[id]` trang chi tiết riêng.

## Đã hoàn thành trong phiên gần nhất (arc này — 2026-07-08)

1. **"Thêm sách" full trang** — bố cục 2 cột (preview bìa trái, form 3 section phải: Thông tin cơ bản/Thông tin xuất bản/Số lượng & vị trí). **Thêm khả năng upload ảnh bìa ngay lúc tạo sách** (trước đây chỉ upload được sau khi lưu) — tạo sách xong tự động upload ảnh đã chọn trong cùng 1 lần submit. Sau khi lưu, quay về trang danh sách `/sach` (theo yêu cầu chỉnh sửa) thay vì trang sửa sách.
2. **"Sửa thông tin sách" full trang** — cùng pattern bố cục 2 cột (bìa + upload trái, form 3 section phải), bảng quản lý bản sao full chiều rộng bên dưới.
3. **Thiết kế lại "Mượn/trả"** theo tư vấn chuẩn quốc tế (OPAC/ILS circulation), người dùng chọn qua `AskUserQuestion`: tách **3 tab** — "Cho mượn" (3 bước: chọn độc giả → chọn sách → giỏ mượn & xác nhận, thẻ tóm tắt độc giả hiện nhất quán dù chọn bằng quét mã hay tìm kiếm), "Trả sách" (quét nhanh 1 cuốn + **giỏ trả nhiều cuốn mới** theo độc giả, tick chọn hàng loạt), "Đang mượn" (bảng + gia hạn, giữ nguyên). Component `PatronPicker` dùng chung giữa 2 tab. Thay toàn bộ `alert()` bằng banner nội tuyến.
4. **Thiết kế lại "Sao lưu/Khôi phục"** theo tư vấn chuẩn quốc tế, người dùng chọn qua `AskUserQuestion`: **sao lưu tự động hàng ngày** (node-cron 3h sáng, bật/tắt + số bản giữ lại tùy chỉnh trong Cài đặt — model `BackupSettings`), **lịch sử sao lưu** hiển thị mọi bản (thủ công/tự động/an toàn trước thao tác nguy hiểm — trước đây các bản "an toàn" tồn tại ngầm, chưa từng hiển thị) kèm Tải xuống/Khôi phục/Xóa từng bản, nút "Sao lưu ngay", **khôi phục yêu cầu gõ đúng "XÁC NHẬN"** (validate cả client lẫn server). Bố cục full trang 2 cột. Mobile đã làm tương đương.
5. **Thiết kế lại "Xóa dữ liệu"** theo tư vấn chuẩn quốc tế, người dùng chọn qua `AskUserQuestion`: **cả 4 thẻ xóa theo loại** (Mượn/trả & Phạt, Độc giả, Sách, Thể loại & Tác giả) nay có cùng mức xác nhận chặt như "Xóa tất cả" — gõ cụm từ riêng cho từng loại (vd. `XOA DOC GIA`) + nhập lại mật khẩu, thay vì `confirm()` đơn giản. Thêm **xem trước số lượng sẽ xóa** (`GET /data-management/counts`), nút "Xóa Thể loại & Tác giả" tự vô hiệu hóa nếu còn sách tham chiếu, và **nhật ký xóa dữ liệu mới** (model `DataDeletionLog`, ai/lúc nào/xóa gì/bao nhiêu dòng, hiển thị bảng dưới trang). Mobile đã làm tương đương.

Cả 3 mục 3-5 đều được xác minh an toàn qua API thật (không chạy thử thao tác phá hủy dữ liệu thật) — xem chi tiết cách xác minh trong [HANDOFF.md](HANDOFF.md).

## Đã hoàn thành trong phiên gần nhất (arc này — 2026-07-09 → 2026-07-10, mobile redesign toàn diện)

1. **Hạ Expo SDK 57 → 54** (`npx expo install expo@^54.0.0 --fix`) để chạy được trên Expo Go thật của người dùng (client báo "Supported SDK 54"). Kéo theo react 19.1.0, react-native 0.81.5, expo-router ^6.0.24 và các package Expo liên quan; thêm `@expo/vector-icons` làm dependency trực tiếp (pnpm strict node_modules không lộ transitive deps cho TypeScript).
2. **UI kit mobile mới** (`apps/mobile/components/ui/`: `Button`, `Card`, `Badge`, `Segmented`) + `apps/mobile/lib/theme.ts` (bảng màu navy/gold dùng chung) — xem quy ước bắt buộc trong [CLAUDE.md](CLAUDE.md).
3. **Điều hướng mobile chuyển từ Stack phẳng sang Tab bar** (`apps/mobile/app/(app)/_layout.tsx`): 5 tab chính (Tổng quan/Mượn-trả/Sách/Độc giả/Thêm) + tab "Thêm" mới (`them.tsx`) gộp Phạt/Báo cáo/Thể loại/Tác giả/Thông báo/Người dùng/Cài đặt. Thêm `_layout.tsx` (Stack con) cho từng thư mục nhiều màn hình: `sach/`, `ban-doc/`, `nguoi-dung/`, `cai-dat/`, `(public)/tra-cuu/`.
4. **Thiết kế lại "Mượn/trả" trên mobile** theo tư vấn chuẩn quốc tế (đối xứng với web): 3 tab Cho mượn/Trả sách/Đang mượn, `PatronPicker` dùng chung (quét mã qua camera + tìm kiếm thủ công), giỏ trả nhiều cuốn theo độc giả.
5. **Thiết kế lại "Tra cứu sách" trên mobile, đồng bộ web**: `/tra-cuu` (công khai) và tab "Sách" (đã đăng nhập) hiển thị **lưới 2 cột bìa sách** cho độc giả; **giữ bảng danh sách** cho nhân viên (theo yêu cầu chỉnh lại sau khi thử lưới — dễ thao tác quản lý hơn). Thêm trang chi tiết sách công khai riêng `(public)/tra-cuu/[id].tsx`.
6. **Thiết kế lại "Tổng quan" cho độc giả trên mobile**, sau đó **đồng bộ ngược lại sang web** (`tong-quan/page.tsx`): thẻ "membership card" navy ở đầu trang (avatar/tên/mã số/lớp/loại độc giả, nút Đổi mật khẩu — trên web đổi màu variant `"gold"` để nổi bật trên nền navy), banner cảnh báo quá hạn riêng, 3 thẻ số liệu, danh sách mượn sắp xếp quá hạn lên đầu.
7. **Sửa lỗi mobile không sửa được thông tin sách**: `sach/[id].tsx` trước đó chưa từng có form sửa (chỉ có upload bìa + quản lý bản sao) — đã bổ sung đầy đủ field (tên/tác giả/thể loại/NXB/năm/ISBN/ngôn ngữ/mô tả), sau đó **thiết kế lại toàn bộ màn hình** theo UI kit mới (header navy, card ảnh bìa, card form theo section, bản sao dạng Card + Badge trạng thái màu theo ý nghĩa). Độc giả xem cùng màn hình này (khi bấm vào 1 cuốn sách từ tab Sách) nay thấy đủ NXB/năm XB/ISBN/ngôn ngữ/vị trí/mô tả (trước đó chỉ có mô tả).
8. **Đổi hình đại diện độc giả từ tròn sang chữ nhật 2:3** (giống bìa sách) trên cả web (`ban-doc` list/chi tiết, `muon-tra` PatronPicker, `tong-quan`, `membership-card.tsx`) và mobile (`ban-doc` list/chi tiết, `muon-tra` PatronPicker, `tong-quan`) — chỉ áp dụng cho Patron, không đổi avatar User/nhân viên.
9. **Sửa thông tin độc giả trên mobile lên full parity với web**: thêm field Email còn thiếu, đổi mật khẩu chuyển từ ô nhập lộ thiên sang Modal, thiết kế lại toàn màn hình theo UI kit (header navy, action button row, card ảnh đại diện, card form, lịch sử mượn/phạt dạng Card+Badge).
10. **Thêm mã vạch (`copy.barcode`) vào mọi nơi hiển thị "sách đang mượn"** trên cả web và mobile: Mượn/trả (giỏ mượn/trả, quét nhanh, bảng đang mượn), Tổng quan, chi tiết độc giả, Phạt, Thông báo (nhắc hạn + quá hạn). Phải bổ sung field `copy`/`barcode` vào `fineWithDetailsSchema`, `DueSoonLoanItem`, `OverdueNotifyItem` (packages/shared) + service tương ứng (`fines/service.ts`, `notifications/service.ts`) vì trước đó các endpoint này chưa trả về barcode.

Toàn bộ mục 1-10 đã xác minh bằng `pnpm --filter @thuvien/api build` + `pnpm --filter @thuvien/web build` + `npx tsc --noEmit` (mobile) + `npx expo export --platform ios` (build thử bundle thật) sau mỗi thay đổi lớn.

## Đã hoàn thành trong phiên gần nhất (arc 2026-09-19 → 2026-09-20 — di trú dữ liệu thật + tính năng nhập dữ liệu phần mềm cũ)

1. **Di trú toàn bộ dữ liệu thật** từ phần mềm thư viện cũ (2 file người dùng cung cấp: `DataThuVien.accdb` — Access, và `TpDsTongQuat.xls` — báo cáo Excel), thực hiện thủ công qua script 1 lần trước khi đóng gói thành tính năng (mục 3):
   - **13.304 bản sao, 7.733 đầu sách — giữ nguyên 100% mã vạch gốc** (`631THxxxxxxx`), kèm ISBN/mô tả/NXB/năm XB/ngôn ngữ/số phân loại DDC/ký hiệu tác giả lấy trực tiếp từ Access (bảng `TpTacPhamPop`/`TpTacPhamCom`/`TpDDC`/`TpNhaXB`/`TpListTacGia`).
   - **18 thể loại** — 10 thể loại tôn giáo/triết học đã seed sẵn (khớp theo `ddcPrefix`) + 8 thể loại mới theo nhóm Dewey cấp 1 (Khoa học xã hội/Ngôn ngữ/Văn học/Lịch sử-Địa lý/...) cho sách ngoài phạm vi tôn giáo.
   - **234 độc giả thật** (`DgDocGia`) — mã độc giả `DG${mã cũ đệm 5 số}`, mật khẩu mặc định `ChungSinh@123`. **Không có ảnh đại diện** — trường "Hinh" trong Access là đối tượng OLE nhúng (Word Document/Metafile Picture), không phải ảnh JPEG thuần, không trích xuất được bằng công cụ thông thường.
   - **7.666 phiếu mượn/trả thật** (`DgMuonTra`, trong đó 106 đang mượn thật — bản sao tự chuyển trạng thái "Đang mượn"), bỏ qua 741 dòng tham chiếu sách đã bị loại khỏi danh mục cũ trước khi xuất dữ liệu.
   - Đã xóa toàn bộ dữ liệu demo/seed cũ trước khi nhập (205 sách/22 độc giả/5 phiếu mượn — xác nhận là seed qua timestamp giống nhau, không phải dữ liệu thật).
   - **Không nhập**: lệ phí/phạt lịch sử (`DgLePhi`, 3.777 dòng) — không có liên kết trực tiếp tới từng lượt mượn cụ thể trong dữ liệu cũ, không ánh xạ sạch được vào bảng `Fine` (vốn gắn 1-1 với 1 `Loan`).
2. **Mã vạch tuần tự cho sách mới** — thêm `BarcodeSettings.nextSequenceNumber` (migration `add_barcode_sequence`): khi có giá trị, mã vạch mới sinh theo dãy số tuần tự `${prefix}${7 chữ số}` (tiếp nối đúng dãy mã vạch cũ, hiện đặt `631TH` + `14734`) thay vì kiểu mặc định dựa trên id sách. Áp dụng ở cả 3 nơi tạo bản sao (nhập Excel sách, thêm sách mới, thêm bản sao). Thêm ô cấu hình trên Cài đặt > Mã vạch (web + mobile).
3. **Tính năng "Nhập dữ liệu từ phần mềm cũ"** (`Cài đặt > Nhập dữ liệu từ phần mềm cũ`, module `old-system-import`) — đóng gói quy trình di trú ở mục 1 thành công cụ dùng lại được trong UI:
   - Nguồn Access (`.accdb`): nhập đường dẫn file trên máy chủ (không upload qua web vì file có thể rất lớn — bản thật 420MB), đọc qua `apps/api/scripts/export-old-library-db.ps1` (PowerShell + OLEDB), 3 ô tick chọn nhập sách/độc giả/lịch sử mượn riêng lẻ. Chỉ QUAN_TRI thấy mục này (đọc file theo đường dẫn tùy ý trên máy chủ — rủi ro cần hạn chế quyền). Chỉ chạy được trên Windows có cài "Microsoft Access Database Engine".
   - Nguồn Excel (báo cáo "Danh sách tổng quát tác phẩm"): chỉ có dữ liệu sách/mã vạch, mọi STAFF_ROLES dùng được.
   - **Hành vi: CỘNG THÊM, bỏ qua những gì đã tồn tại** — sách trùng tên (không phân biệt hoa/thường) dùng lại đầu sách hiện có; mã vạch/mã độc giả/phiếu mượn đã có thì bỏ qua — an toàn để chạy lại nhiều lần, không bao giờ xóa/ghi đè dữ liệu hiện có. Thể loại khớp động theo `ddcPrefix` của các thể loại đã cấu hình sẵn (không hard-code riêng cho thư viện này); không khớp được thì rơi vào "Chưa phân loại" (tự tạo).
   - Đã kiểm thử thật bằng cách chạy lại với chính file Access gốc: báo đúng 0 mới/bỏ qua toàn bộ (khớp chính xác dữ liệu đã nhập ở mục 1) — xác nhận logic chống trùng đúng.
4. Thêm `*.accdb`/`TpDsTongQuat.xls` vào `.gitignore` (dữ liệu cá nhân thật của độc giả, tránh lộ khi commit).

Toàn bộ mục 1-4 đã xác minh bằng build API/Web + `npx tsc --noEmit` (mobile) + gọi API/Prisma thật (không dùng công cụ trình duyệt).

## Đang chờ / chưa có phản hồi từ người dùng

- Các tính năng vừa thiết kế lại ở arc 2026-07-09 → 2026-07-10 (mục ngay trên) — người dùng đang phản hồi/điều chỉnh trực tiếp qua từng lượt trong phiên (đã yêu cầu chỉnh sửa 2 lần cho `sach/[id].tsx`), coi như đang trong vòng lặp góp ý, chưa chốt xong hẳn.
- 5 tính năng thiết kế lại ở arc 2026-07-08 (Thêm sách, Sửa sách, Mượn/trả, Sao lưu/Khôi phục, Xóa dữ liệu) — chưa có phản hồi bằng mắt riêng biệt (môi trường không có công cụ trình duyệt để tự xác nhận).

## Chưa làm (backlog tiềm năng, chưa ai yêu cầu)

- Đặt trước sách (reservation/holds) — đã hoãn sang v2 từ đầu dự án theo kế hoạch gốc, quy mô chủng viện nhỏ nên chưa cần.
- Deploy lên môi trường ngoài local (đổi `DATABASE_URL`/`provider` sang Postgres) — chưa được yêu cầu.
- Build APK qua EAS để cài thử điện thoại thật — cấu hình `eas.json` đã có sẵn nhưng chưa build lần nào trong các phiên gần đây.
- Chọn phạm vi xóa dữ liệu theo bộ lọc (vd. chỉ xóa lượt mượn cũ hơn N năm) — đã cân nhắc khi tư vấn "Xóa dữ liệu" nhưng chưa được yêu cầu, hiện vẫn là xóa toàn bộ theo loại.
- Bắt buộc đổi mật khẩu lần đăng nhập đầu (`mustChangePassword`) — hiện chưa có, đáng chú ý vì 234 độc giả vừa di trú đang dùng chung 1 mật khẩu mặc định `ChungSinh@123`.
- Rà soát thủ công dữ liệu di trú còn thiếu: 113 đầu sách "Không rõ tác giả" (`Author.name`), 234 độc giả chưa gán `PatronType`/Khóa-Lớp (`className` — dữ liệu cũ không có trường tương đương), vài độc giả có 9-23 lượt mượn active vượt hạn mức chính sách mặc định.
- Ảnh đại diện độc giả cho 234 độc giả vừa di trú — không trích xuất được từ file Access cũ (trường "Hinh" là OLE Object, không phải ảnh JPEG thuần); nếu cần, phải chụp/scan lại thủ công.
- Bộ test tự động (unit/integration) cho API/Web/Mobile — hiện chưa có test suite nào trong repo.
- Security review chính thức qua toàn bộ repo — chưa từng chạy (skill `security-review` có sẵn trong Claude Code, chưa dùng).
