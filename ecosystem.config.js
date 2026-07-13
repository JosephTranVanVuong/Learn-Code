// PM2 trên Windows không xử lý tốt các shim ".CMD" của pnpm/npx/next khi gọi
// qua "pm2 start pnpm -- start" — nên trỏ thẳng tới file .mjs/.js thật của
// từng công cụ (tsx, next) để tránh lỗi "Script not found".
module.exports = {
  apps: [
    {
      name: "thuvien-api",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "src/server.ts",
      cwd: "./apps/api",
      interpreter: "node",
    },
    {
      name: "thuvien-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./apps/web",
      interpreter: "node",
    },
  ],
};
