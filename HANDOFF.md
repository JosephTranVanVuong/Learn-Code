# HANDOFF.md — Bàn giao phiên làm việc

Cập nhật lần cuối: 2026-07-08. Không phải git repo (chưa `git init`) — không có lịch sử commit để đối chiếu, tài liệu này là nguồn duy nhất ghi lại các thay đổi gần đây.

## Việc vừa hoàn thành, theo đúng thứ tự yêu cầu của người dùng (phiên gần nhất, 2026-07-08)

1. "Thêm sách" full trang.
2. Cho phép upload ảnh bìa ngay lúc thêm sách (thay vì phải lưu xong mới upload được).
3. Sau khi lưu sách mới, quay về `/sach` thay vì trang sửa sách.
4. Chạy lại môi trường dev local theo yêu cầu.
5. Tư vấn + triển khai thiết kế lại "Mượn/trả" (3 tab: Cho mượn/Trả sách/Đang mượn, giỏ trả hàng loạt mới).
6. Tư vấn + triển khai thiết kế lại "Sao lưu/Khôi phục" (sao lưu tự động, lịch sử sao lưu, khôi phục gõ "XÁC NHẬN").
7. "Sửa thông tin sách" full trang.
8. Bố cục full trang cho "Sao lưu/Khôi phục" (2 cột).
9. Tư vấn + triển khai thiết kế lại "Xóa dữ liệu" (xác nhận gõ cụm từ + mật khẩu cho cả 4 loại, nhật ký xóa dữ liệu).
10. Cập nhật 4 file tài liệu này (đang làm ngay bây giờ).

Chi tiết đầy đủ từng mục nằm trong [CURRENT_PHASE.md](CURRENT_PHASE.md).

## Trạng thái ngay lúc bàn giao

- Không có việc nào đang dang dở — mọi task ở trên đã build thành công (API + Web) và type-check mobile sạch.
- Dev server có thể đang chạy hoặc đã dừng tùy thời điểm bạn đọc file này — luôn kiểm tra lại bằng `curl http://localhost:4000/health` trước khi giả định nó đang chạy (xem quy trình trong [CLAUDE.md](CLAUDE.md) mục "Quy trình dev trên Windows").
- 5 tính năng vừa redesign (Thêm sách, Sửa sách, Mượn/trả, Sao lưu/Khôi phục, Xóa dữ liệu) đều **chưa được người dùng xác nhận bằng mắt** — chỉ mới verify qua build + curl/API thật.

## Cách đã xác minh các tính năng phá hủy dữ liệu (Sao lưu/Khôi phục, Xóa dữ liệu) một cách AN TOÀN — áp dụng lại nếu cần verify thêm

- **Không bao giờ chạy thật một thao tác phá hủy dữ liệu thật của người dùng để test.**
- Với Sao lưu/Khôi phục: verify cổng chặn (sai "XÁC NHẬN" → 400) bằng request thật; verify luồng thành công bằng cách **tạo 1 bản sao lưu thủ công rồi tự khôi phục chính bản đó lên chính nó** (self-restore no-op — không đổi dữ liệu vì là snapshot của chính hiện tại), sau đó xóa sạch các file backup test đã tạo ra (`manual-*`, `pre-restore-*` phát sinh thêm) và trả `retentionCount` về giá trị cũ.
- Với Xóa dữ liệu: chỉ verify `GET /counts`, `GET /logs` (read-only) và test cổng chặn bằng cụm từ/mật khẩu SAI (400/401) trên cả 4 loại — xác nhận lại `counts`/`logs` không đổi sau đó. **Không** gõ đúng cụm từ + mật khẩu thật để test thành công, vì điều đó sẽ xóa dữ liệu thật (dù có sao lưu tự động trước, đây vẫn là quyết định của người dùng, không phải của Claude).

## Lỗi/vướng mắc đã gặp và đã xử lý (không cần lặp lại điều tra)

- Class Tailwind không hợp lệ (`h-4.5 w-4.5`, `h-5.5 w-5.5`) — dùng số nguyên gần nhất (`h-4`, `h-5`).
- `EPERM` khi migrate Prisma trên Windows vì `tsx watch` giữ lock `.dll.node` — luôn kill tiến trình `turbo run dev` trước khi migrate (đã lặp lại nhiều lần cho các migration `add_user_avatar`, `add_backup_settings`, `add_data_deletion_log`).
- Đường dẫn `/tmp/...` trong Git-Bash bị Node-on-Windows hiểu sai thành `D:\tmp\...` — dùng đường dẫn Windows forward-slash qua `process.argv`.
- Dev server hay "chết lặng" giữa các lượt — kill + khởi động lại bằng `(pnpm dev > /tmp/dev-server.log 2>&1 &)` là đủ.
- TypeScript: regex match group có thể `undefined` (`match?.[1] || fallback`) khi suy ra label từ tên file backup — gặp trong `db-file.ts::labelFromFilename`.

## Quyết định thiết kế cần nhớ (để không hỏi lại người dùng)

- "Chủng sinh"→"Độc giả": CHỈ đổi text hiển thị, KHÔNG đổi model/route/hằng số code.
- Trang chi tiết sách tra cứu công khai: **trang riêng** (`/tra-cuu/[id]`), không modal.
- Nút "Đổi mật khẩu" trên trang sửa thông tin luôn đặt cạnh nút hành động chính, mở qua Modal.
- **Mượn/trả**: bố cục **3 tab riêng** (không giữ 1 trang dài); **có** giỏ trả nhiều cuốn cùng lúc theo độc giả (đối xứng giỏ mượn).
- **Sao lưu tự động**: tần suất/số bản giữ lại **tùy chỉnh trong Cài đặt** (không cố định cứng, không tự chọn "hàng ngày giữ 7 bản" mà không cho sửa).
- **Khôi phục dữ liệu**: xác nhận bằng cách **gõ đúng "XÁC NHẬN"** (không chỉ hộp thoại thường) — hằng số `RESTORE_CONFIRM_PHRASE` dùng chung frontend/backend.
- **Xóa dữ liệu theo từng loại**: nâng lên mức xác nhận **giống hệt "Xóa tất cả"** (gõ cụm từ riêng + mật khẩu), không dùng phương án nhẹ hơn (gõ số dòng).
- **Có** nhật ký xóa dữ liệu (audit log) — người dùng chọn "có" khi được hỏi, không phải chỉ dựa vào bản sao lưu tự động.
- Khi được yêu cầu "tư vấn... chuẩn quốc tế" cho một chức năng: đọc code hiện tại trước, nêu khoảng trống cụ thể (không chung chung), rồi `AskUserQuestion` 1-2 điểm rẽ nhánh chính trước khi code — đã áp dụng nhất quán cho Mượn/trả, Sao lưu/Khôi phục, Xóa dữ liệu, đều được người dùng chấp nhận phương án khuyến nghị.

## Việc chưa được yêu cầu — không tự ý làm nếu chưa hỏi

- Không tự refactor định danh code liên quan tới "chủng sinh"/"CHUNG_SINH" dù UI đã đổi tên.
- Không tự chạy build APK (EAS) hay deploy — chưa ai yêu cầu.
- Không tự thêm tính năng đặt trước sách (reservation) — đã hoãn sang v2.
- Không tự thêm lọc phạm vi xóa dữ liệu theo ngày/điều kiện — đã đề cập lúc tư vấn nhưng chưa ai yêu cầu, vẫn giữ "xóa toàn bộ theo loại".
- Không tự thực thi thật thao tác xóa hàng loạt/khôi phục CSDL lên dữ liệu thật để "test cho chắc" — xem mục an toàn ở trên.

## Bước tiếp theo hợp lý nhất (nếu người dùng quay lại mà không nói gì cụ thể)

Hỏi người dùng đã xem qua 5 tính năng vừa thiết kế lại chưa (`/sach/moi`, `/sach/[id]`, `/muon-tra`, `/cai-dat/sao-luu`, `/cai-dat/xoa-du-lieu`) và có phản hồi/điều chỉnh gì không — đây là các task gần nhất chưa có xác nhận cuối cùng từ họ.
