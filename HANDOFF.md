# HANDOFF.md — Bàn giao phiên làm việc

Cập nhật lần cuối: 2026-07-07. Không phải git repo (chưa `git init`) — không có lịch sử commit để đối chiếu, tài liệu này là nguồn duy nhất ghi lại các thay đổi gần đây.

## Việc vừa hoàn thành, theo đúng thứ tự yêu cầu của người dùng (phiên gần nhất)

1. Sinh dữ liệu test số lượng lớn (25/25/25/22/20/20 theo từng loại) để kiểm tra chức năng xóa dữ liệu.
2. Đổi hiển thị "Chủng sinh" → "Độc giả" toàn bộ UI, giữ nguyên định danh code.
3. Thêm chức năng xóa vĩnh viễn người dùng (cạnh nút vô hiệu hóa).
4. Chạy môi trường dev local theo yêu cầu ("hãy chạy localhost").
5. Tư vấn + triển khai giỏ hàng mượn nhiều sách một lúc (batch loan, atomic).
6. Thiết kế lại trang Sửa thông tin độc giả (full trang, Modal đổi mật khẩu).
7. Thiết kế lại trang Sửa thông tin người dùng + thêm avatar upload (migration mới `avatarUrl` trên `User`).
8. Thêm đổi mật khẩu tự phục vụ cho độc giả trên Tổng quan.
9. Thiết kế lại trang Tra cứu sách công khai: lưới bìa sách + trang chi tiết riêng `/tra-cuu/[id]` (người dùng chọn "Trang riêng" qua AskUserQuestion). Build + curl-verify đã xong, **người dùng chưa xem/phản hồi trực tiếp**.

Chi tiết đầy đủ từng mục nằm trong [CURRENT_PHASE.md](CURRENT_PHASE.md).

## Trạng thái ngay lúc bàn giao

- Không có việc nào đang dang dở — mọi task ở trên đã build thành công và verify qua curl/type-check.
- Dev server có thể đang chạy hoặc đã dừng tùy thời điểm bạn đọc file này — luôn kiểm tra lại bằng `curl http://localhost:4000/health` trước khi giả định nó đang chạy (xem quy trình trong [CLAUDE.md](CLAUDE.md) mục "Quy trình dev trên Windows").
- Việc duy nhất còn "mở" là chờ người dùng xem trực tiếp trang `/tra-cuu` và `/tra-cuu/[id]` mới thiết kế lại, vì môi trường sandbox này không có công cụ trình duyệt (`chromium-cli`/`playwright`) để tự xác nhận UI bằng ảnh chụp.

## Lỗi/vướng mắc đã gặp và đã xử lý trong phiên này (không cần lặp lại điều tra)

- Class Tailwind không hợp lệ (`h-4.5 w-4.5`, `h-5.5 w-5.5`) — Tailwind mặc định không có scale `.5` ở size đó → sửa về số nguyên gần nhất (`h-4 w-4`, `h-5 w-5`). Nếu gặp lại lỗi tương tự với các số lẻ `.5`, kiểm tra config Tailwind trước khi dùng.
- `EPERM` khi migrate Prisma trên Windows vì `tsx watch` (từ `turbo run dev`) giữ lock file `.dll.node` — luôn kill tiến trình `turbo run dev` trước khi migrate.
- Đường dẫn `/tmp/...` trong Git-Bash bị Node-on-Windows hiểu sai thành `D:\tmp\...` — dùng đường dẫn Windows kiểu forward-slash truyền qua `process.argv` khi cần script `node -e` thao tác file tạm.
- Dev server hay "chết lặng" giữa các lượt (curl trả lỗi kết nối) — kill + khởi động lại là đủ, không phải lỗi code.

## Quyết định thiết kế cần nhớ (để không hỏi lại người dùng)

- "Chủng sinh"→"Độc giả": CHỈ đổi text hiển thị, KHÔNG đổi model/route/hằng số code. Ngoại lệ: `vi.settings.patronTypesDesc` giữ "Chủng sinh" làm ví dụ tên loại.
- Trang chi tiết sách trong tra cứu công khai: dùng **trang riêng** (`/tra-cuu/[id]`), không dùng modal — người dùng đã chọn rõ qua AskUserQuestion, không cần hỏi lại nếu mở rộng thêm chi tiết cho trang này sau này.
- Nút "Đổi mật khẩu" trên các trang sửa thông tin (độc giả/người dùng) luôn đặt gần cạnh nút hành động chính (In thẻ / Vô hiệu hóa) về bên trái, mở bằng Modal riêng — đây là pattern đã lặp lại 2 lần, nên áp dụng nhất quán nếu có trang sửa thông tin tương tự trong tương lai.

## Việc chưa được yêu cầu — không tự ý làm nếu chưa hỏi

- Không tự refactor định danh code liên quan tới "chủng sinh"/"CHUNG_SINH" dù UI đã đổi tên — đây là ranh giới người dùng đã chốt rõ.
- Không tự chạy build APK (EAS) hay deploy — chưa ai yêu cầu.
- Không tự thêm tính năng đặt trước sách (reservation) — đã hoãn sang v2 từ đầu dự án.

## Bước tiếp theo hợp lý nhất (nếu người dùng quay lại mà không nói gì cụ thể)

Hỏi người dùng xem đã kiểm tra trang Tra cứu sách mới (`http://localhost:3000/tra-cuu`) chưa và có phản hồi/điều chỉnh gì không — đây là task gần nhất chưa có xác nhận cuối cùng từ họ.
