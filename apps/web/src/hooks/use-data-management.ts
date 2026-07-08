"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeleteWithConfirmationInput } from "@thuvien/shared";
import { dataManagementApi } from "@/lib/resources";

function useInvalidateAllData() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useDeleteDataCounts() {
  return useQuery({ queryKey: ["data-management", "counts"], queryFn: () => dataManagementApi.getCounts() });
}

export function useDeletionLogs() {
  return useQuery({ queryKey: ["data-management", "logs"], queryFn: () => dataManagementApi.getLogs() });
}

export function useDeleteLoansFines() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: (input: DeleteWithConfirmationInput) => dataManagementApi.deleteLoansFines(input),
    onSuccess: invalidateAll,
  });
}

export function useDeletePatronsData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: (input: DeleteWithConfirmationInput) => dataManagementApi.deletePatrons(input),
    onSuccess: invalidateAll,
  });
}

export function useDeleteBooksData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: (input: DeleteWithConfirmationInput) => dataManagementApi.deleteBooks(input),
    onSuccess: invalidateAll,
  });
}

export function useDeleteCategoriesAuthorsData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: (input: DeleteWithConfirmationInput) => dataManagementApi.deleteCategoriesAuthors(input),
    onSuccess: invalidateAll,
  });
}

export function useDeleteAllData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: (input: DeleteWithConfirmationInput) => dataManagementApi.deleteAll(input),
    onSuccess: invalidateAll,
  });
}
