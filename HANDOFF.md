# HANDOFF.md — Bàn giao phiên làm việc

Cập nhật lần cuối: 2026-07-10. Repo đã có git (`git init` đã chạy, xem `git log` để đối chiếu lịch sử commit thật — tài liệu này bổ sung ngữ cảnh/quyết định mà git log không nói rõ, không thay thế nó).

## Việc vừa hoàn thành, theo đúng thứ tự yêu cầu của người dùng (arc gần nhất, 2026-07-09 → 2026-07-10)

1. Hướng dẫn khởi động localhost, rồi chạy thật `pnpm dev`.
2. Hướng dẫn chạy thử trên iPhone qua Expo Go.
3. Xử lý lỗi "Project is incompatible with this version of Expo Go" — hạ Expo SDK 57 → 54 để khớp Expo Go thật của người dùng (client báo "Supported SDK 54").
4. Tư vấn + triển khai thiết kế lại "Mượn/trả" trên mobile chuẩn quốc tế (hạ tầng: tab bar + UI kit trước, rồi tới Mượn/trả — 3 tab, `PatronPicker` dùng chung).
5. Tư vấn + triển khai thiết kế lại "Tra cứu sách" trên mobile, đồng bộ web (lưới bìa sách 2 cột, áp dụng cho cả tra cứu công khai và tab Sách đã đăng nhập).
6. Tư vấn + triển khai thiết kế lại "Tổng quan" cho độc giả trên mobile.
7. Chạy lại (reset) môi trường dev local theo yêu cầu.
8. Đồng bộ bản thiết kế "Tổng quan" độc giả từ mobile sang web.
9. Đổi màu nút "Đổi mật khẩu" trên Tổng quan web (độc giả) sang variant `gold` để nổi bật trên nền navy.
10. Chuyển trang "Sách" của độc giả trên web sang dạng lưới bìa sách.
11. Trả trang "Sách" của **nhân viên** trên mobile về dạng bảng danh sách như cũ (sau khi thử lưới thấy khó thao tác quản lý hơn) — độc giả vẫn giữ lưới.
12. Sửa lỗi mobile không sửa được thông tin sách (`sach/[id].tsx` trước đó chưa từng có form sửa metadata sách).
13. Đổi hình đại diện độc giả (Patron) từ tròn sang chữ nhật 2:3 giống bìa sách, trên cả web và mobile.
14. Đồng bộ hiển thị chi tiết trên web/mobile (đợt rà soát nhất quán sau các thay đổi trên).
15. Thêm mã vạch (`copy.barcode`) vào mọi nơi hiển thị "sách đang mượn" trên cả web và mobile (Mượn/trả, Tổng quan, chi tiết độc giả, Phạt, Thông báo) — kèm bổ sung field còn thiếu ở backend (`fineWithDetailsSchema`, `DueSoonLoanItem`, `OverdueNotifyItem`).
16. Thiết kế lại toàn bộ màn hình "Sửa thông tin sách" trên mobile theo UI kit mới (người dùng chê giao diện cũ "xấu").
17. Bổ sung đầy đủ thông tin chi tiết sách (NXB/năm/ISBN/ngôn ngữ/mô tả) cho **độc giả** khi bấm vào 1 cuốn sách trên mobile — màn hình vừa redesign ở mục 16 ban đầu chỉ có mô tả, thiếu các trường còn lại so với bản tra cứu công khai.
18. Cập nhật 4 file tài liệu này (đang làm ngay bây giờ).

Chi tiết đầy đủ từng mục nằm trong [CURRENT_PHASE.md](CURRENT_PHASE.md).

## Trạng thái ngay lúc bàn giao

- Không có việc nào đang dang dở — mọi task ở trên đã build thành công (API + Web), type-check mobile sạch (`npx tsc --noEmit`), và bundle mobile build thành công qua `npx expo export --platform ios` sau mỗi thay đổi lớn.
- Dev server có thể đang chạy hoặc đã dừng tùy thời điểm bạn đọc file này — luôn kiểm tra lại bằng `curl http://localhost:4000/health` trước khi giả định nó đang chạy (xem quy trình trong [CLAUDE.md](CLAUDE.md) mục "Quy trình dev trên Windows").
- Repo giờ đã là git repo thật (khác thời điểm viết bản HANDOFF trước) — dùng `git log`/`git status` để xem lịch sử/thay đổi thay vì chỉ dựa vào file này.
- Người dùng đang trong nhịp phản hồi nhanh liên tiếp cho các màn hình mobile vừa redesign (đã yêu cầu chỉnh `sach/[id].tsx` 2 lần trong cùng arc) — nhiều khả năng còn tiếp tục góp ý thêm ở lượt kế tiếp, đừng coi các màn hình này là đã "chốt" hẳn.
- 5 tính năng redesign từ arc trước đó (2026-07-08: Thêm sách, Sửa sách, Mượn/trả web, Sao lưu/Khôi phục, Xóa dữ liệu) vẫn **chưa được người dùng xác nhận bằng mắt** riêng biệt — chỉ mới verify qua build + curl/API thật.

## Cách đã xác minh các tính năng phá hủy dữ liệu (Sao lưu/Khôi phục, Xóa dữ liệu) một cách AN TOÀN — áp dụng lại nếu cần verify thêm

- **Không bao giờ chạy thật một thao tác phá hủy dữ liệu thật của người dùng để test.**
- Với Sao lưu/Khôi phục: verify cổng chặn (sai "XÁC NHẬN" → 400) bằng request thật; verify luồng thành công bằng cách **tạo 1 bản sao lưu thủ công rồi tự khôi phục chính bản đó lên chính nó** (self-restore no-op — không đổi dữ liệu vì là snapshot của chính hiện tại), sau đó xóa sạch các file backup test đã tạo ra (`manual-*`, `pre-restore-*` phát sinh thêm) và trả `retentionCount` về giá trị cũ.
- Với Xóa dữ liệu: chỉ verify `GET /counts`, `GET /logs` (read-only) và test cổng chặn bằng cụm từ/mật khẩu SAI (400/401) trên cả 4 loại — xác nhận lại `counts`/`logs` không đổi sau đó. **Không** gõ đúng cụm từ + mật khẩu thật để test thành công.

## Cách đã xác minh thay đổi mobile (không có simulator/thiết bị thật trong sandbox) — áp dụng cho mọi thay đổi route/navigation/UI mobile

1. `cd apps/mobile && npx tsc --noEmit -p tsconfig.json` — bắt lỗi type.
2. `npx expo export --platform ios --output-dir <đường-dẫn-scratchpad-tuyệt-đối>` — build **thật** toàn bộ bundle qua Metro/Babel (cùng pipeline Expo Go dùng), bắt được lỗi route/import/tên icon sai mà `tsc` bỏ sót. Luôn `rm -rf` thư mục export tạm sau khi xong.
3. Không dùng cách curl trực tiếp bundle URL Metro (`/index.bundle?platform=ios`) để verify — không khớp cách expo-router resolve entry point, đã thử và luôn ra 404 dù app chạy bình thường.
4. Nói rõ với người dùng rằng bạn không tự chụp ảnh xác nhận UI được — luôn đề nghị họ tự mở app kiểm tra bằng mắt tại route cụ thể.

## Lỗi/vướng mắc đã gặp và đã xử lý (không cần lặp lại điều tra)

- Class Tailwind không hợp lệ (`h-4.5 w-4.5`, `h-5.5 w-5.5`) — dùng số nguyên gần nhất (`h-4`, `h-5`).
- `EPERM` khi migrate Prisma trên Windows vì `tsx watch` giữ lock `.dll.node` — luôn kill tiến trình `turbo run dev` trước khi migrate.
- Đường dẫn `/tmp/...` trong Git-Bash bị Node-on-Windows hiểu sai thành `D:\tmp\...` — dùng đường dẫn Windows forward-slash qua `process.argv`, hoặc dùng thư mục scratchpad tuyệt đối.
- Dev server hay "chết lặng" giữa các lượt — kill + khởi động lại bằng `(pnpm dev > /tmp/dev-server.log 2>&1 &)` là đủ, poll `curl http://localhost:4000/health` và `curl http://localhost:8081` (Metro) tới khi cả hai trả 200.
- TypeScript: regex match group có thể `undefined` (`match?.[1] || fallback`) khi suy ra label từ tên file backup — gặp trong `db-file.ts::labelFromFilename`.
- **Expo Go SDK không tương thích**: dự án SDK 57 vượt quá SDK Expo Go thật hỗ trợ (SDK 54) — sửa bằng `npx expo install expo@^54.0.0 --fix` (không tự sửa tay version từng package).
- **`@expo/vector-icons` không resolve được dù có trong `node_modules`** — do là transitive dependency của `expo`, pnpm strict node_modules không lộ cho TypeScript. Sửa bằng `npx expo install @expo/vector-icons` để thêm làm direct dependency.
- **Tabs + thư mục nhiều màn hình con trong expo-router v6**: nếu một thư mục (`sach/`, `ban-doc/`, ...) không có `_layout.tsx` riêng, mỗi file bên trong sẽ tự động thành 1 tab riêng ở ngoài cùng thay vì nested — luôn thêm `_layout.tsx` (Stack) cho thư mục nhiều màn hình khi chuyển sang Tabs.

## Quyết định thiết kế cần nhớ (để không hỏi lại người dùng)

- "Chủng sinh"→"Độc giả": CHỈ đổi text hiển thị, KHÔNG đổi model/route/hằng số code.
- Trang chi tiết sách tra cứu công khai: **trang riêng** (`/tra-cuu/[id]`), không modal — áp dụng cho cả web và mobile.
- Nút "Đổi mật khẩu" trên trang sửa thông tin luôn đặt cạnh nút hành động chính, mở qua Modal (web: `Modal` component; mobile: RN `Modal`) — không để ô nhập mật khẩu mới lộ thiên ngay trên trang.
- **Mượn/trả**: bố cục **3 tab riêng** (không giữ 1 trang dài) — áp dụng cả web lẫn mobile; **có** giỏ trả nhiều cuốn cùng lúc theo độc giả (đối xứng giỏ mượn).
- **Sao lưu tự động**: tần suất/số bản giữ lại **tùy chỉnh trong Cài đặt** (không cố định cứng).
- **Khôi phục dữ liệu**: xác nhận bằng cách **gõ đúng "XÁC NHẬN"** — hằng số `RESTORE_CONFIRM_PHRASE` dùng chung frontend/backend.
- **Xóa dữ liệu theo từng loại**: nâng lên mức xác nhận **giống hệt "Xóa tất cả"** (gõ cụm từ riêng + mật khẩu). **Có** nhật ký xóa dữ liệu (audit log).
- **Điều hướng mobile**: chuyển hẳn sang **Tab bar** (5 tab chính + "Thêm" gộp phần còn lại), không giữ Stack phẳng với menu điều hướng thủ công như trước.
- **Tra cứu sách / tab Sách**: **lưới bìa sách 2 cột cho độc giả**, nhưng **bảng danh sách cho nhân viên** — quyết định này khác nhau theo role, đã bị người dùng yêu cầu đảo ngược lại một lần trên mobile (ban đầu làm lưới cho cả staff, sau đó staff yêu cầu trả về bảng vì dễ thao tác quản lý hơn). Không tự ý đổi lưới↔bảng cho staff nếu chưa được yêu cầu lại.
- **Avatar độc giả (Patron)**: hình chữ nhật tỉ lệ 2:3 giống bìa sách (KHÔNG áp dụng cho User/nhân viên — avatar User vẫn tròn).
- **Mọi màn hình mobile redesign từ nay dùng chung UI kit** `apps/mobile/components/ui/` (Button/Card/Badge/Segmented) + `apps/mobile/lib/theme.ts` — không hardcode màu/style rời rạc như các màn hình cũ chưa redesign.
- **Hiển thị loan/fine luôn kèm mã vạch bản sao** (`copy.barcode`) — người dùng yêu cầu rõ vì cần phân biệt chính xác cuốn nào trong nhiều bản sao cùng tên sách.
- **Expo SDK khóa ở SDK 54** — không tự nâng cấp trừ khi người dùng xác nhận lại phiên bản Expo Go họ đang cài.
- Khi được yêu cầu "tư vấn... chuẩn quốc tế" cho một chức năng: đọc code hiện tại trước, nêu khoảng trống cụ thể, rồi `AskUserQuestion` 1-2 điểm rẽ nhánh chính trước khi code — đã áp dụng nhất quán cho Mượn/trả (web + mobile), Tra cứu sách mobile, Tổng quan mobile, Sao lưu/Khôi phục, Xóa dữ liệu; người dùng luôn chọn phương án khuyến nghị.

## Việc chưa được yêu cầu — không tự ý làm nếu chưa hỏi

- Không tự refactor định danh code liên quan tới "chủng sinh"/"CHUNG_SINH" dù UI đã đổi tên.
- Không tự chạy build APK (EAS) hay deploy — chưa ai yêu cầu.
- Không tự thêm tính năng đặt trước sách (reservation) — đã hoãn sang v2.
- Không tự thêm lọc phạm vi xóa dữ liệu theo ngày/điều kiện — đã đề cập lúc tư vấn nhưng chưa ai yêu cầu.
- Không tự thực thi thật thao tác xóa hàng loạt/khôi phục CSDL lên dữ liệu thật để "test cho chắc".
- Không tự nâng cấp lại Expo SDK lên bản mới hơn — đã hạ xuống SDK 54 có chủ đích để khớp thiết bị thật của người dùng.
- Không tự đổi lưới↔bảng cho màn hình "Sách"/"Tra cứu" của nhân viên — quyết định theo role đã chốt, staff giữ bảng.
- Không tự redesign các màn hình mobile còn lại chưa được yêu cầu (vd. `sach/moi.tsx` — thêm sách trên mobile vẫn còn giao diện cũ, chỉ `sach/[id].tsx` — sửa sách đã được redesign vì người dùng chỉ hỏi riêng phần "sửa thông tin sách").

## Bước tiếp theo hợp lý nhất (nếu người dùng quay lại mà không nói gì cụ thể)

Hỏi người dùng đã xem qua các màn hình mobile vừa redesign trong arc này (Mượn/trả, Tra cứu sách/tab Sách, Tổng quan, Sửa thông tin sách, Sửa thông tin độc giả) trên điện thoại thật qua Expo Go chưa, và có muốn tiếp tục redesign các màn hình mobile còn lại theo cùng UI kit không (ứng viên rõ nhất: `sach/moi.tsx` — thêm sách, vẫn đang dùng giao diện cũ chưa qua UI kit mới).
