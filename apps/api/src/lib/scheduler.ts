import cron from "node-cron";
import { getNotificationSettings, sendDueSoonReminders, sendOverdueNotices } from "../modules/notifications/service";
import { getBackupSettings } from "../modules/settings/service";
import { createLabeledBackup, pruneBackupsByLabel } from "./db-file";

/** Chạy mỗi ngày lúc 7:00 sáng (giờ máy chủ): nhắc trả sách sắp đến hạn + thông báo quá hạn. */
export function startNotificationScheduler() {
  cron.schedule("0 7 * * *", async () => {
    try {
      const settings = await getNotificationSettings();
      if (!settings.autoSendEnabled) {
        console.log("[notifications] Đã tắt gửi email tự động — bỏ qua lần chạy hôm nay.");
        return;
      }
      const dueSoon = await sendDueSoonReminders();
      console.log(`[notifications] Nhắc trước hạn: đã gửi ${dueSoon.sent}/${dueSoon.totalLoans}`);
      const overdue = await sendOverdueNotices();
      console.log(`[notifications] Thông báo quá hạn: đã gửi ${overdue.sent}/${overdue.totalLoans}`);
    } catch (err) {
      console.error("[notifications] Lỗi khi gửi thông báo tự động:", err);
    }
  });
}

/** Chạy mỗi ngày lúc 3:00 sáng (giờ máy chủ): sao lưu tự động + dọn bản cũ vượt quá số lượng giữ lại. */
export function startBackupScheduler() {
  cron.schedule("0 3 * * *", async () => {
    try {
      const settings = await getBackupSettings();
      if (!settings.autoBackupEnabled) {
        console.log("[backup] Đã tắt sao lưu tự động — bỏ qua lần chạy hôm nay.");
        return;
      }
      await createLabeledBackup("auto");
      await pruneBackupsByLabel("auto", settings.retentionCount);
      console.log(`[backup] Đã tạo bản sao lưu tự động (giữ lại tối đa ${settings.retentionCount} bản).`);
    } catch (err) {
      console.error("[backup] Lỗi khi sao lưu tự động:", err);
    }
  });
}
