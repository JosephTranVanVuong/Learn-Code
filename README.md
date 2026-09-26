# Thư viện Đại Chủng Viện Phaolô Lê Bảo Tịnh, Thanh Hóa

Hệ thống quản lý thư viện: web (Next.js) + mobile (Expo/React Native) dùng chung một API (Fastify), tổ chức theo monorepo pnpm + Turborepo.

## Cấu trúc

```
apps/
  api/      Fastify — API dùng chung cho web và mobile (http://localhost:4000)
  web/      Next.js — quản trị + tra cứu công khai (http://localhost:3000)
  mobile/   Expo — bản mobile đầy đủ chức năng
packages/
  database/ Prisma schema (SQLite) + seed dữ liệu mẫu
  shared/   Zod schemas, api-client dùng chung, hằng số, từ điển tiếng Việt
```

## Chạy lần đầu

```bash
pnpm install
pnpm db:migrate   # tạo database SQLite local (packages/database/prisma/dev.db)
pnpm db:seed      # tạo tài khoản mẫu + dữ liệu mẫu
pnpm dev          # chạy song song API :4000, Web :3000, Expo dev server
```

Tài khoản mẫu sau khi seed:
- Thủ thư: `thuthu@cvpl.edu.vn` / `Admin@123`
- Độc giả: `CS001` hoặc `CS002` / `ChungSinh@123`

## Chức năng đã có

- **Danh mục sách**: quản lý thể loại, sách, bản sao (mã vạch, trạng thái, vị trí kệ); tra cứu công khai không cần đăng nhập tại `/tra-cuu`.
- **Chủng sinh**: hồ sơ, đặt lại mật khẩu, vô hiệu hóa/kích hoạt lại.
- **Mượn/trả**: cho mượn, trả sách (tự tính phạt nếu trễ hạn), gia hạn với ngày tùy chọn qua lịch (native date picker), theo dõi quá hạn tự động.
- **Phạt**: danh sách theo trạng thái, thu tiền, miễn phạt.
- **Báo cáo & thống kê** (`/bao-cao`): tổng quan số liệu, sách mượn nhiều nhất, lượt mượn theo thời gian, danh sách quá hạn, độc giả mượn nhiều nhất. Web dùng biểu đồ (recharts); mobile dùng thẻ thống kê + thanh tỷ lệ.
- **Nhập dữ liệu từ phần mềm thư viện cũ** (`Cài đặt > Nhập dữ liệu từ phần mềm cũ`): nhập sách/mã vạch/độc giả/lịch sử mượn-trả từ file Access (`.accdb`, đọc theo đường dẫn trên máy chủ — chỉ Windows, cần cài "Microsoft Access Database Engine") hoặc file Excel báo cáo "Danh sách tổng quát". Luôn cộng thêm, bỏ qua dữ liệu đã tồn tại — an toàn chạy lại nhiều lần.

Web và mobile có đầy đủ chức năng tương đương nhau, cùng gọi chung một API.

## Chạy thử trên điện thoại thật

1. Cài ứng dụng **Expo Go** trên điện thoại.
2. Đảm bảo điện thoại và máy tính cùng mạng Wi-Fi/LAN.
3. Sửa `apps/mobile/.env`, đặt `EXPO_PUBLIC_API_URL` thành địa chỉ IP LAN của máy tính (không dùng `localhost`), ví dụ `http://192.168.1.59:4000`.
4. Quét mã QR hiện ra khi chạy `pnpm dev` (hoặc `pnpm --filter @thuvien/mobile dev`).

Khi cần đóng gói APK cài trực tiếp (không qua Expo Go), dùng EAS Build (cấu hình sẵn tại `apps/mobile/eas.json`):

```bash
cd apps/mobile
npx eas build --profile preview --platform android
```

## Cài lên máy chủ thật trong mạng nội bộ (LAN)

Xem hướng dẫn chi tiết từng bước (dành cho người mới, không cần biết lập trình):
- `HUONG-DAN-CAI-DAT-LAN.txt` — không dùng Docker, chạy trực tiếp qua PM2.
- `HUONG-DAN-CAI-DAT-LAN-DOCKER.txt` — dùng Docker.
- `HUONG-DAN-CAI-DAT-MOBILE-LAN.txt` — cấu hình app mobile trỏ vào máy chủ LAN.

## Ghi chú kiến trúc

- Auth dùng JWT access token (15 phút) + refresh token (30 ngày). Web lưu refresh token trong cookie httpOnly; mobile lưu trong Expo SecureStore.
- SQLite dùng cho local dev; khi cần deploy, đổi `provider` trong `packages/database/prisma/schema.prisma` sang `postgresql` và cập nhật `DATABASE_URL`.
- Enum trong Prisma không được SQLite hỗ trợ nên các trường trạng thái (role, status...) được lưu dạng `String`, ràng buộc giá trị hợp lệ ở tầng Zod (`packages/shared`).
