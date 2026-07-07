import cron from "node-cron";
import { getNotificationSettings, sendDueSoonReminders, sendOverdueNotices } from "../modules/notifications/service";

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
