"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeleteAllDataInput } from "@thuvien/shared";
import { dataManagementApi } from "@/lib/resources";

function useInvalidateAllData() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useDeleteLoansFines() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: () => dataManagementApi.deleteLoansFines(),
    onSuccess: invalidateAll,
  });
}

export function useDeletePatronsData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: () => dataManagementApi.deletePatrons(),
    onSuccess: invalidateAll,
  });
}

export function useDeleteBooksData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: () => dataManagementApi.deleteBooks(),
    onSuccess: invalidateAll,
  });
}

export function useDeleteCategoriesAuthorsData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: () => dataManagementApi.deleteCategoriesAuthors(),
    onSuccess: invalidateAll,
  });
}

export function useDeleteAllData() {
  const invalidateAll = useInvalidateAllData();
  return useMutation({
    mutationFn: (input: DeleteAllDataInput) => dataManagementApi.deleteAll(input),
    onSuccess: invalidateAll,
  });
}
