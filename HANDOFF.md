# HANDOFF.md — Bàn giao phiên làm việc

Cập nhật lần cuối: 2026-09-20. Repo đã có git (`git init` đã chạy, xem `git log` để đối chiếu lịch sử commit thật — tài liệu này bổ sung ngữ cảnh/quyết định mà git log không nói rõ, không thay thế nó).

## Việc vừa hoàn thành, theo đúng thứ tự yêu cầu của người dùng (arc gần nhất, 2026-09-19 → 2026-09-20 — di trú dữ liệu thật + tính năng nhập dữ liệu phần mềm cũ)

1. Người dùng nêu vấn đề: chuyển từ phần mềm thư viện cũ sang hệ thống này thì phải đổi hết mã vạch dán trên sách — hỏi tư vấn cách xử lý. Đọc code (`BookCopy.barcode` chỉ là `String @unique` không ràng buộc định dạng) → xác định KHÔNG cần đổi mã vạch vật lý, chỉ cần giữ nguyên giá trị khi nhập dữ liệu.
2. Người dùng cung cấp 2 file dữ liệu thật vào repo: `DataThuVien.accdb` (Access, 420MB — CSDL gốc đầy đủ) và `TpDsTongQuat.xls` (báo cáo Excel "Danh sách tổng quát tác phẩm", 13.302 dòng). Đọc cấu trúc Access qua PowerShell + OLEDB (`Microsoft.ACE.OLEDB.16.0`), đối chiếu với 2 file → quyết định dùng Access làm nguồn chính (đầy đủ hơn: có ISBN/mô tả/ngôn ngữ/tác giả trực tiếp qua `TpTacPhamCom.MaKyHieuTg → TpListTacGia`, không cần crutch Excel).
3. `AskUserQuestion` chốt 3 điểm trước khi code: phạm vi (chỉ sách/bản sao/mã vạch trước), thể loại mới cho sách ngoài tôn giáo (tạo thêm theo chuẩn Dewey), cách đối chiếu sách trùng (theo tên chính xác) → tạo mapping DDC→thể loại, xuất báo cáo Excel review trước khi đụng CSDL.
4. Di trú thật (script 1 lần, đã xóa sau khi chạy — xem [CURRENT_PHASE.md](CURRENT_PHASE.md) mục 1 để biết số liệu đầy đủ): backup CSDL trước mỗi bước → xóa dữ liệu demo/seed cũ → nhập 13.304 bản sao/7.733 sách/18 thể loại → nhập 234 độc giả thật (phát hiện và sửa lỗi: ảnh "Hinh" trong Access là OLE Object không phải JPEG, đã gỡ 208 `avatarUrl` sai ngay khi phát hiện) → nhập 7.666 phiếu mượn/trả thật.
5. Người dùng hỏi mã vạch sách MỚI thêm sau này có giống kiểu cũ không → tư vấn + `AskUserQuestion` → chọn "tiếp tục dãy số cũ" → thêm `BarcodeSettings.nextSequenceNumber` (migration Prisma thật), sửa `allocateBarcodes()` dùng chung cho 3 nơi tạo bản sao, thêm UI Cài đặt (web + mobile).
6. Người dùng hỏi tư vấn tổng quát "cần update gì để hoàn thiện app" → rà soát tài liệu + phát hiện rủi ro cụ thể (file dữ liệu thật chưa `.gitignore`, 234 độc giả dùng chung 1 mật khẩu, dữ liệu thiếu tác giả/loại độc giả) → `AskUserQuestion` ưu tiên → người dùng chọn hướng khác: xây tính năng nhập dữ liệu cũ thành công cụ dùng lại được trong UI.
7. `AskUserQuestion` chốt 2 điểm trước khi code tính năng: hành vi cộng thêm/bỏ qua trùng (không xóa/ghi đè) và cách nhập file Access (đường dẫn server, không upload — file có thể 400MB+). Xây module `old-system-import` đầy đủ (script PowerShell dùng chung + 3 hàm import books/patrons/loans + route + UI web) — xem chi tiết trong [PROJECT_MAP.md](PROJECT_MAP.md). Kiểm thử thật bằng cách chạy lại với chính file Access gốc, xác nhận báo đúng 0 mới/bỏ qua toàn bộ.
8. Thêm `*.accdb`/`TpDsTongQuat.xls` vào `.gitignore`.
9. Cập nhật cả 5 tài liệu này, gồm `CLAUDE.md` — thêm 2 quy ước lâu dài mới: luôn gọi `allocateBarcodes()` thay vì `generateBarcode()` thẳng, và cách xử lý khi máy chạy PM2 kiểu Windows Service (không tự `pm2`/`taskkill` được, phải nhờ người dùng).

Toàn bộ mục 1-8 đã xác minh bằng build API/Web (`pnpm --filter @thuvien/api typecheck`, `pnpm --filter @thuvien/web build`) + `npx tsc --noEmit`/`npx expo export --platform ios` (mobile) + gọi Prisma/API thật — không dùng công cụ trình duyệt (không có sẵn trong sandbox).

## Việc vừa hoàn thành, theo đúng thứ tự yêu cầu của người dùng (arc 2026-07-09 → 2026-07-10)

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
- **CSDL hiện có DỮ LIỆU THẬT** (không còn seed/demo): 7.733 sách/13.304 bản sao/18 thể loại/3.711 tác giả/234 độc giả/7.666 phiếu mượn-trả, di trú từ phần mềm thư viện cũ trong arc 2026-09-19 → 2026-09-20 — xem chi tiết đầy đủ và các việc còn thiếu (ảnh độc giả, tác giả/loại độc giả chưa gán, mật khẩu mặc định dùng chung) trong [CURRENT_PHASE.md](CURRENT_PHASE.md). **Không tự ý xóa/reset dữ liệu này** — các backup an toàn nằm tại `packages/database/prisma/backups/pre-migration-*.db`, `pre-patron-migration-*.db`, `pre-loan-migration-*.db` nếu cần đối chiếu/khôi phục.
- **Máy của người dùng chạy `thuvien-api`/`thuvien-web` thường trực qua PM2 kiểu Windows Service** (không phải `pnpm dev` tạm thời) — lệnh `pm2 ...` gõ từ phiên Claude Code (Bash/PowerShell thường) sẽ báo `connect EPERM //./pipe/rpc.sock` vì không cùng quyền với tài khoản service; cũng không `taskkill` trực tiếp được tiến trình đó (`Access is denied`). Muốn restart/generate Prisma Client, phải **nhờ người dùng tự chạy** (`Restart thuvien-api thuvien-web.bat`, hoặc `pm2 restart ...` trong PowerShell "Run as administrator" của họ) — xem thêm `HUONG-DAN-CAI-DAT-LAN.txt` Phần 9.3.
- Dev server tạm (`pnpm dev`) có thể đang chạy hoặc đã dừng tùy thời điểm bạn đọc file này — luôn kiểm tra lại bằng `curl http://localhost:4000/health` trước khi giả định nó đang chạy; nhưng lưu ý cổng 4000/3000 nhiều khả năng ĐÃ bị chiếm bởi PM2 (mục ngay trên) nên `pnpm dev` có thể báo `EADDRINUSE` — không phải lỗi, đó là dấu hiệu PM2 đang phục vụ thật, dùng luôn service đó để verify qua `curl` thay vì cố khởi động thêm 1 bản dev server.
- Repo giờ đã là git repo thật — dùng `git log`/`git status` để xem lịch sử/thay đổi thay vì chỉ dựa vào file này.
- 5 tính năng redesign từ arc 2026-07-08 (Thêm sách, Sửa sách, Mượn/trả web, Sao lưu/Khôi phục, Xóa dữ liệu) và các màn hình mobile redesign arc 2026-07-09 → 2026-07-10 vẫn **chưa được người dùng xác nhận bằng mắt** riêng biệt — chỉ mới verify qua build + curl/API thật.

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
- **Đọc file Access (.accdb) từ PowerShell**: cần `Microsoft.ACE.OLEDB.16.0` (hoặc `.12.0`) qua `System.Data.OleDb.OleDbConnection` — join nhiều bảng trong Jet SQL bắt buộc dấu ngoặc lồng tăng dần từ trái (`(((A JOIN B) JOIN C) JOIN D)`), thiếu 1 lớp ngoặc sẽ báo "Syntax error (missing operator)".
- **PowerShell: gọi hàm với cú pháp `Func($a, $b)` (giống C-style) KHÔNG truyền 2 tham số riêng** — dấu phẩy tạo ra 1 mảng `@($a, $b)` truyền vào tham số ĐẦU TIÊN, tham số thứ 2 không được gán. Phải gọi kiểu PowerShell thật: `Func $a $b` (cách nhau bằng khoảng trắng, không ngoặc/phẩy) — bug này từng làm hỏng toàn bộ dữ liệu ngày tháng khi xuất JSON từ Access (mọi giá trị bị nối thêm " True"/" False").
- **Xuất JSON tay từ PowerShell qua `StringBuilder`**: phải tự strip control character (`[regex]::Replace($s, '[\x00-\x1F]', ' ')`) khỏi text field trước khi ghép vào JSON — mô tả sách trong Access có thể chứa tab/newline thật, nếu không strip sẽ ra JSON không hợp lệ (parse lỗi khó thấy vì Node in nguyên văn bản 3MB làm ngữ cảnh lỗi). Cũng phải tự bỏ BOM (`charCodeAt(0) === 0xfeff`) khi đọc lại bằng Node — `[System.IO.File]::WriteAllText` với `UTF8Encoding` mặc định có BOM.
- **Trường ảnh (OLE Object) trong Access KHÔNG phải file ảnh thuần** — dù cột tên "Hinh"/hiển thị được trong Access, dữ liệu nhị phân thật là đối tượng OLE bọc (Word Document, Metafile Picture...), không thể lưu thẳng làm `.jpg`. Cần parser OLE Structured Storage chuyên biệt mới trích được ảnh thật (chưa làm) — đừng giả định field ảnh trong Access cũ là JPEG/PNG thuần.
- **PM2 chạy kiểu Windows Service khác hẳn PM2 thường**: nếu máy đích đã cấu hình theo `HUONG-DAN-CAI-DAT-LAN.txt` Phần 9.3, driver `.dll.node` của Prisma Client bị tiến trình đó giữ khóa liên tục (không chỉ lúc `tsx watch` như trước) — `prisma migrate dev`/`prisma generate` sẽ báo `EPERM: operation not permitted, rename ...query_engine-windows.dll.node`. Không tự `taskkill`/`pm2 stop` được từ phiên Claude Code (khác quyền tài khoản) — phải nhờ người dùng tự dừng service trước, generate xong nhắc họ khởi động lại.

## Cách đã xác minh việc di trú/nhập dữ liệu thật một cách AN TOÀN — áp dụng lại nếu cần di trú thêm

- **Luôn backup CSDL trước mỗi bước ghi dữ liệu lớn** (`cp packages/database/prisma/dev.db packages/database/prisma/backups/pre-<việc>-<timestamp>.db`) — đã cứu được nhiều lần trong arc 2026-09-19.
- Trước khi xóa dữ liệu hiện có để thay bằng dữ liệu thật, **luôn xác minh dữ liệu hiện có đúng là seed/demo** (không phải người dùng đã tự nhập tay) — cách làm: so `createdAt` của các dòng (seed script tạo hàng loạt trong cùng 1 giây), và/hoặc tên gợi ý demo (`"TEST01"`, `"Test Độc giả 01"`). Từng phát hiện 5 phiếu mượn "trông như thật" (patron tên người Việt bình thường, không phải "TEST...") hóa ra vẫn là seed vì tạo cùng batch với patron `CS001` demo — đừng vội kết luận chỉ dựa vào tên nhìn "có vẻ thật".
- Với tính năng nhập dữ liệu **cộng thêm/bỏ qua trùng** (không phải xóa-rồi-nhập-lại): cách kiểm thử an toàn nhất là **chạy lại với chính dữ liệu ĐÃ nhập rồi** — nếu đúng, hệ thống phải báo "0 dòng mới, bỏ qua toàn bộ" và số liệu bỏ qua khớp chính xác với lần nhập trước. Đã áp dụng để verify tính năng `old-system-import` mà không cần tạo dữ liệu test giả hay đụng vào dữ liệu thật thêm lần nào.

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
- Khi được yêu cầu "tư vấn... chuẩn quốc tế" cho một chức năng: đọc code hiện tại trước, nêu khoảng trống cụ thể, rồi `AskUserQuestion` 1-2 điểm rẽ nhánh chính trước khi code — đã áp dụng nhất quán cho Mượn/trả (web + mobile), Tra cứu sách mobile, Tổng quan mobile, Sao lưu/Khôi phục, Xóa dữ liệu, di trú dữ liệu thật, tính năng nhập dữ liệu cũ; người dùng luôn chọn phương án khuyến nghị.
- **Mã độc giả di trú từ phần mềm cũ**: quy ước cố định `DG${MaDocGia cũ, đệm 5 số}` (vd. `DG00196`) — dùng làm khóa đối chiếu trùng lặp khi chạy lại `old-system-import`, KHÔNG đổi quy ước này nếu không sẽ làm hỏng tính năng "cộng thêm/bỏ qua trùng" cho các lần nhập sau.
- **Thể loại cho sách nhập từ phần mềm cũ**: khớp động theo `Category.ddcPrefix` đã cấu hình sẵn trong hệ thống (khoảng số DDC gần nhất, không phải string prefix) — KHÔNG hard-code lại bộ 18 thể loại Công giáo cụ thể của thư viện này vào code dùng chung (`import-books.ts`), vì tính năng cần tổng quát cho thư viện khác dùng phần mềm cũ tương tự. Không khớp được thì vào "Chưa phân loại" (tự tạo, `ddcPrefix: null`).
- **Nhập dữ liệu từ phần mềm cũ luôn CỘNG THÊM, không bao giờ xóa/ghi đè** — khác hẳn với lần di trú ban đầu (mục 4 phía trên) vốn xóa sạch demo trước khi nhập. Đừng nhầm lẫn 2 hành vi này khi sửa `old-system-import`.
- **File Access (.accdb) nhập qua đường dẫn server, không upload qua form web** — vì file thật có thể 400MB+, không phù hợp multipart upload. Chỉ QUAN_TRI dùng được mục này (đọc file theo đường dẫn tùy ý trên máy chủ là rủi ro cần hạn chế quyền).

## Việc chưa được yêu cầu — không tự ý làm nếu chưa hỏi

- Không tự refactor định danh code liên quan tới "chủng sinh"/"CHUNG_SINH" dù UI đã đổi tên.
- Không tự chạy build APK (EAS) hay deploy — chưa ai yêu cầu.
- Không tự thêm tính năng đặt trước sách (reservation) — đã hoãn sang v2.
- Không tự thêm lọc phạm vi xóa dữ liệu theo ngày/điều kiện — đã đề cập lúc tư vấn nhưng chưa ai yêu cầu.
- Không tự thực thi thật thao tác xóa hàng loạt/khôi phục CSDL lên dữ liệu thật để "test cho chắc".
- Không tự nâng cấp lại Expo SDK lên bản mới hơn — đã hạ xuống SDK 54 có chủ đích để khớp thiết bị thật của người dùng.
- Không tự đổi lưới↔bảng cho màn hình "Sách"/"Tra cứu" của nhân viên — quyết định theo role đã chốt, staff giữ bảng.
- Không tự redesign các màn hình mobile còn lại chưa được yêu cầu (vd. `sach/moi.tsx` — thêm sách trên mobile vẫn còn giao diện cũ, chỉ `sach/[id].tsx` — sửa sách đã được redesign vì người dùng chỉ hỏi riêng phần "sửa thông tin sách").
- Không tự nhập lịch sử lệ phí (`DgLePhi`) vào bảng `Fine` — dữ liệu cũ không liên kết trực tiếp tới từng `Loan`, ánh xạ ẩu sẽ ra dữ liệu phạt sai. Nếu người dùng cần, nên làm dạng báo cáo tham khảo riêng, không nhét vào bảng `Fine` hiện có.
- Không tự thêm cơ chế bắt buộc đổi mật khẩu lần đầu (`mustChangePassword`) cho độc giả dù 234 độc giả vừa di trú đang dùng chung 1 mật khẩu — đã nêu trong tư vấn nhưng chưa được yêu cầu triển khai.
- Không tự gán `PatronType`/điền `className` cho 234 độc giả vừa di trú — dữ liệu cũ không có trường tương đương đáng tin cậy, để trống chờ người dùng tự rà soát/gán qua UI.

## Bước tiếp theo hợp lý nhất (nếu người dùng quay lại mà không nói gì cụ thể)

Hỏi người dùng đã khởi động lại service (`pm2 restart thuvien-api thuvien-web` hoặc file `.bat`) và thử tính năng "Nhập dữ liệu từ phần mềm cũ" (`Cài đặt > Nhập dữ liệu từ phần mềm cũ`) trên trình duyệt thật chưa — đây là việc vừa xong cuối arc gần nhất, chưa được xác nhận bằng mắt. Nếu đã xong, gợi ý các việc còn tồn đọng theo thứ tự ưu tiên: (1) thêm `mustChangePassword` cho 234 độc giả đang dùng chung mật khẩu mặc định, (2) rà soát 113 sách "Không rõ tác giả" + gán `PatronType`/Khóa-Lớp cho độc giả, (3) các màn hình mobile redesign từ arc 2026-07-09 → 2026-07-10 vẫn chưa được xác nhận bằng mắt qua Expo Go thật.
