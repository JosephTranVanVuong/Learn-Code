// PM2 trên Windows không xử lý tốt các shim ".CMD" của pnpm/npx/next khi gọi
// qua "pm2 start pnpm -- start" — nên trỏ thẳng tới file .mjs/.js thật của
// từng công cụ (tsx, next) để tránh lỗi "Script not found".
//
// Khi PM2 chạy dưới dạng Windows Service (qua pm2-installer), tiến trình
// chạy bằng tài khoản hệ thống "Local Service" chứ không phải tài khoản
// người dùng thường — TEMP/TMP mặc định lúc đó vẫn có thể trỏ nhầm về thư
// mục Temp của tài khoản người dùng (không có quyền ghi), khiến tsx báo lỗi
// "EPERM: operation not permitted, mkdir ...\Temp\tsx-LOCAL SERVICE" và API
// crash lặp lại liên tục. Chỉ định rõ TEMP/TMP về một thư mục mà tài khoản
// chạy PM2 chắc chắn có quyền ghi để tránh lỗi này.
const tmpDir = "C:\\ProgramData\\pm2\\tmp";

module.exports = {
  apps: [
    {
      name: "thuvien-api",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "src/server.ts",
      cwd: "./apps/api",
      interpreter: "node",
      env: { TEMP: tmpDir, TMP: tmpDir },
    },
    {
      name: "thuvien-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./apps/web",
      interpreter: "node",
      env: { TEMP: tmpDir, TMP: tmpDir },
    },
  ],
};
