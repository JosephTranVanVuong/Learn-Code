"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SendTestEmailInput,
  UpdateBarcodeSettingsInput,
  UpdateFineSettingsInput,
  UpdateLibrarySettingsInput,
} from "@thuvien/shared";
import { settingsApi } from "@/lib/resources";

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
