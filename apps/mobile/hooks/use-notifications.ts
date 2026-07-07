import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateNotificationSettingsInput } from "@thuvien/shared";
import { notificationsApi } from "../lib/resources";

export function useNotificationSettings() {
  return useQuery({ queryKey: ["notifications", "settings"], queryFn: () => notificationsApi.getSettings() });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationSettingsInput) => notificationsApi.updateSettings(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "settings"] }),
  });
}

export function useDueSoonLoans() {
  return useQuery({ queryKey: ["notifications", "due-soon"], queryFn: () => notificationsApi.dueSoon() });
}

export function useOverdueForNotify() {
  return useQuery({ queryKey: ["notifications", "overdue"], queryFn: () => notificationsApi.overdue() });
}

export function useSendDueSoon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.sendDueSoon(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useSendOverdue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.sendOverdue(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
