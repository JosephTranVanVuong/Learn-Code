import { z } from "zod";

export const dueSoonLoanItemSchema = z.object({
  loanId: z.string(),
  bookTitle: z.string(),
  barcode: z.string(),
  dueDate: z.string(),
  patronName: z.string(),
  studentCode: z.string(),
  hasEmail: z.boolean(),
});
export type DueSoonLoanItem = z.infer<typeof dueSoonLoanItemSchema>;

export const overdueNotifyItemSchema = z.object({
  loanId: z.string(),
  bookTitle: z.string(),
  barcode: z.string(),
  dueDate: z.string(),
  patronName: z.string(),
  studentCode: z.string(),
  daysOverdue: z.number().int(),
  estimatedFine: z.number().int(),
  hasEmail: z.boolean(),
});
export type OverdueNotifyItem = z.infer<typeof overdueNotifyItemSchema>;

export const notifySendResultSchema = z.object({
  smtpConfigured: z.boolean(),
  totalLoans: z.number().int(),
  sent: z.number().int(),
  skippedNoEmail: z.number().int(),
  failed: z.number().int(),
});
export type NotifySendResult = z.infer<typeof notifySendResultSchema>;

export const notificationSettingsSchema = z.object({
  autoSendEnabled: z.boolean(),
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const updateNotificationSettingsInputSchema = z.object({
  autoSendEnabled: z.boolean(),
});
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsInputSchema>;
