"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FineQuery } from "@thuvien/shared";
import { finesApi } from "@/lib/resources";

export function useFines(query: Partial<FineQuery>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["fines", "list", query],
    queryFn: () => finesApi.list(query),
    enabled: options?.enabled,
  });
}

export function useMyFines() {
  return useQuery({
    queryKey: ["fines", "mine"],
    queryFn: () => finesApi.mine(),
  });
}

export function usePayFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => finesApi.pay(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fines"] }),
  });
}

export function useWaiveFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => finesApi.waive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fines"] }),
  });
}
