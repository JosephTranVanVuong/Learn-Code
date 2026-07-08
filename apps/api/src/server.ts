import { buildApp } from "./app";
import { env } from "./config/env";
import { startBackupScheduler, startNotificationScheduler } from "./lib/scheduler";

buildApp()
  .then((app) => app.listen({ port: env.API_PORT, host: "0.0.0.0" }))
  .then(() => {
    console.log(`API đang chạy tại http://localhost:${env.API_PORT} (docs: /docs)`);
    startNotificationScheduler();
    startBackupScheduler();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
