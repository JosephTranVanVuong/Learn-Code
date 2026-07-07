import type { ApiClient } from "../api-client";
import type {
  DueSoonLoanItem,
  NotificationSettings,
  NotifySendResult,
  OverdueNotifyItem,
  UpdateNotificationSettingsInput,
} from "../schemas/notification.schema";

export function createNotificationsApi(client: ApiClient) {
  return {
    dueSoon: () => client.get<DueSoonLoanItem[]>("/api/v1/notifications/due-soon"),
    overdue: () => client.get<OverdueNotifyItem[]>("/api/v1/notifications/overdue"),
    sendDueSoon: () => client.post<NotifySendResult>("/api/v1/notifications/due-soon/send"),
    sendOverdue: () => client.post<NotifySendResult>("/api/v1/notifications/overdue/send"),
    getSettings: () => client.get<NotificationSettings>("/api/v1/notifications/settings"),
    updateSettings: (input: UpdateNotificationSettingsInput) =>
      client.patch<NotificationSettings>("/api/v1/notifications/settings", input),
  };
}
