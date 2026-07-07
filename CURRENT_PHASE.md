# CURRENT_PHASE.md — Trạng thái tính năng hiện tại

Cập nhật lần cuối: 2026-07-07

## Đã hoàn thành (nền tảng, các phiên trước)

- Scaffold monorepo (pnpm + Turborepo), Prisma schema + seed, API auth đầy đủ (login/refresh/logout/me + JWT + phân quyền theo role).
- CRUD danh mục sách: thể loại, tác giả, sách, bản sao (mã vạch, trạng thái, vị trí kệ). Trang tra cứu công khai.
- CRUD độc giả (Patron), loại độc giả (chính sách mượn), import Excel.
- Mượn/trả sách, gia hạn, quá hạn tự động, tính phạt trễ hạn, thu tiền/miễn phạt.
- Báo cáo & thống kê (web: recharts; mobile: thẻ số liệu + thanh tỷ lệ).
- Cài đặt hệ thống (thông tin thư viện, mức phạt/ngày, tiền tố mã vạch, bật/tắt gửi email tự động), quản lý người dùng nhân viên (QUAN_TRI/THU_THU/CONG_TAC_VIEN).
- Web và mobile có chức năng tương đương nhau, dùng chung 1 API.

## Đã hoàn thành trong phiên gần nhất (arc này)

1. **Dữ liệu test:** sinh 25 thể loại, 25 tác giả, 25 sách, 22 độc giả, 20 lượt mượn, 20 khoản phạt qua `seed-test-data.ts` để kiểm tra chức năng xóa dữ liệu.
2. **Đổi tên hiển thị "Chủng sinh" → "Độc giả"** trên toàn bộ UI (menu, nhãn, thông báo lỗi) — **chỉ đổi text**, giữ nguyên mọi định danh code (model `Patron`, role `"CHUNG_SINH"`, route `ban-doc`). Ngoại lệ giữ nguyên: `vi.settings.patronTypesDesc`.
3. **Xóa vĩnh viễn người dùng** — nút cạnh "Vô hiệu hóa" trên trang Sửa thông tin người dùng; chặn tự xóa chính mình (giống logic đã có với độc giả).
4. **Giỏ hàng mượn sách** — cho phép quét/chọn nhiều sách rồi xác nhận mượn hàng loạt trong 1 lần, thay vì lặp lại việc nhập tên độc giả cho từng cuốn. Backend: endpoint `POST /loans/batch`, atomic (`$transaction`), kiểm tra `maxActiveLoans` cho toàn bộ giỏ trước khi ghi, tự động loại các bản sao không còn sẵn khỏi giỏ nếu bị giành mất giữa lúc thao tác. Web + mobile đều có UI giỏ hàng.
5. **Thiết kế lại trang "Sửa thông tin độc giả"** — bố cục full trang 2 cột (avatar trái, form phải), nút "Đổi mật khẩu" cạnh "In thẻ" mở qua Modal riêng.
6. **Thiết kế lại trang "Sửa thông tin người dùng"** + **thêm tính năng upload avatar cho người dùng** (trước đây chỉ độc giả có avatar — đã thêm migration `avatarUrl` cho model `User`). Nút "Đổi mật khẩu" cạnh "Vô hiệu hóa" mở qua Modal.
7. **Đổi mật khẩu tự phục vụ cho độc giả** trên trang Tổng quan (góc phải trên) — wiring lại `changePasswordSchema` (tồn tại sẵn trong `packages/shared` nhưng chưa từng được dùng ở đâu) thành endpoint `POST /auth/change-password` + Modal trên web và mobile.
8. **Thiết kế lại trang "Tra cứu sách" công khai** theo chuẩn OPAC quốc tế:
   - `/tra-cuu`: lưới bìa sách responsive (2→5 cột), badge tình trạng còn sách, hover-lift, bộ lọc thể loại + "chỉ hiện sách còn sẵn", đếm số kết quả.
   - `/tra-cuu/[id]` (**mới**): trang chi tiết công khai riêng (người dùng chọn phương án "Trang riêng" qua AskUserQuestion thay vì modal) — bìa lớn, thông tin đầy đủ (NXB, năm XB, ISBN, ngôn ngữ, vị trí kệ nếu đồng nhất giữa các bản sao), mô tả sách.
   - Build web pass, cả 2 route curl-verified 200. **Chưa được người dùng xác nhận bằng mắt** (môi trường không có công cụ trình duyệt).

## Đang chờ / chưa có phản hồi từ người dùng

- Trang "Tra cứu sách" mới thiết kế lại — người dùng chưa xem/phản hồi trực tiếp (chỉ mới xác nhận build + curl).

## Chưa làm (backlog tiềm năng, chưa ai yêu cầu)

- Đặt trước sách (reservation/holds) — đã hoãn sang v2 từ đầu dự án theo kế hoạch gốc, quy mô chủng viện nhỏ nên chưa cần.
- Deploy lên môi trường ngoài local (đổi `DATABASE_URL`/`provider` sang Postgres) — chưa được yêu cầu.
- Build APK qua EAS để cài thử điện thoại thật — cấu hình `eas.json` đã có sẵn nhưng chưa build lần nào trong các phiên gần đây.
