import type { ApiClient } from "../api-client";
import type {
  BarcodeSettings,
  EmailStatus,
  FineSettings,
  LibrarySettings,
  SendTestEmailInput,
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

    downloadBackup: () => client.getBlob("/api/v1/settings/backup"),
    restoreBackup: (formData: FormData) =>
      client.upload<{ success: boolean }>("/api/v1/settings/restore", formData),
  };
}
