import type { ApiClient } from "../api-client";
import type {
  BackupEntry,
  BackupSettings,
  BarcodeSettings,
  EmailStatus,
  FineSettings,
  LibrarySettings,
  SendTestEmailInput,
  UpdateBackupSettingsInput,
  UpdateBarcodeSettingsInput,
  UpdateFineSettingsInput,
  UpdateLibrarySettingsInput,
} from "../schemas/settings.schema";

export function createSettingsApi(client: ApiClient) {
  return {
    getLibrary: () => client.get<LibrarySettings>("/api/v1/settings/library"),
    updateLibrary: (input: UpdateLibrarySettingsInput) =>
      client.patch<LibrarySettings>("/api/v1/settings/library", input),
    uploadLibraryLogo: (formData: FormData) =>
      client.upload<LibrarySettings>("/api/v1/settings/library/logo", formData),
    removeLibraryLogo: () => client.delete<void>("/api/v1/settings/library/logo"),

    getFine: () => client.get<FineSettings>("/api/v1/settings/fine"),
    updateFine: (input: UpdateFineSettingsInput) => client.patch<FineSettings>("/api/v1/settings/fine", input),

    getBarcode: () => client.get<BarcodeSettings>("/api/v1/settings/barcode"),
    updateBarcode: (input: UpdateBarcodeSettingsInput) =>
      client.patch<BarcodeSettings>("/api/v1/settings/barcode", input),

    getEmailStatus: () => client.get<EmailStatus>("/api/v1/settings/email"),
    sendTestEmail: (input: SendTestEmailInput) =>
      client.post<{ sent: boolean }>("/api/v1/settings/email/test", input),

    getBackupSettings: () => client.get<BackupSettings>("/api/v1/settings/backup-settings"),
    updateBackupSettings: (input: UpdateBackupSettingsInput) =>
      client.patch<BackupSettings>("/api/v1/settings/backup-settings", input),

    listBackups: () => client.get<BackupEntry[]>("/api/v1/settings/backups"),
    createBackup: () => client.post<BackupEntry>("/api/v1/settings/backups"),
    downloadBackupFile: (filename: string) =>
      client.getBlob(`/api/v1/settings/backups/${encodeURIComponent(filename)}/download`),
    deleteBackup: (filename: string) => client.delete<void>(`/api/v1/settings/backups/${encodeURIComponent(filename)}`),
    restoreFromBackup: (filename: string, confirm: string) =>
      client.post<{ success: boolean }>(`/api/v1/settings/backups/${encodeURIComponent(filename)}/restore`, {
        confirm,
      }),
    restoreBackup: (formData: FormData, confirm: string) =>
      client.upload<{ success: boolean }>(
        `/api/v1/settings/restore?confirm=${encodeURIComponent(confirm)}`,
        formData,
      ),
  };
}
