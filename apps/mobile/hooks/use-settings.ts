import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SendTestEmailInput,
  UpdateBackupSettingsInput,
  UpdateBarcodeSettingsInput,
  UpdateFineSettingsInput,
  UpdateLibrarySettingsInput,
} from "@thuvien/shared";
import { settingsApi } from "../lib/resources";

export function useLibrarySettings() {
  return useQuery({ queryKey: ["settings", "library"], queryFn: () => settingsApi.getLibrary() });
}

export function useUpdateLibrarySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLibrarySettingsInput) => settingsApi.updateLibrary(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "library"] }),
  });
}

export function useUploadLibraryLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => settingsApi.uploadLibraryLogo(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "library"] }),
  });
}

export function useRemoveLibraryLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.removeLibraryLogo(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "library"] }),
  });
}

export function useFineSettings() {
  return useQuery({ queryKey: ["settings", "fine"], queryFn: () => settingsApi.getFine() });
}

export function useUpdateFineSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFineSettingsInput) => settingsApi.updateFine(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "fine"] }),
  });
}

export function useBarcodeSettings() {
  return useQuery({ queryKey: ["settings", "barcode"], queryFn: () => settingsApi.getBarcode() });
}

export function useUpdateBarcodeSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBarcodeSettingsInput) => settingsApi.updateBarcode(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "barcode"] }),
  });
}

export function useEmailStatus() {
  return useQuery({ queryKey: ["settings", "email"], queryFn: () => settingsApi.getEmailStatus() });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (input: SendTestEmailInput) => settingsApi.sendTestEmail(input),
  });
}

export function useBackupSettings() {
  return useQuery({ queryKey: ["settings", "backup-settings"], queryFn: () => settingsApi.getBackupSettings() });
}

export function useUpdateBackupSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBackupSettingsInput) => settingsApi.updateBackupSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "backup-settings"] }),
  });
}

export function useBackups() {
  return useQuery({ queryKey: ["settings", "backups"], queryFn: () => settingsApi.listBackups() });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.createBackup(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "backups"] }),
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => settingsApi.deleteBackup(filename),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "backups"] }),
  });
}

export function useRestoreFromBackup() {
  return useMutation({
    mutationFn: ({ filename, confirm }: { filename: string; confirm: string }) =>
      settingsApi.restoreFromBackup(filename, confirm),
  });
}

export function useRestoreBackupUpload() {
  return useMutation({
    mutationFn: ({ formData, confirm }: { formData: FormData; confirm: string }) =>
      settingsApi.restoreBackup(formData, confirm),
  });
}
