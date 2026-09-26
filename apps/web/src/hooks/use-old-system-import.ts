import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImportOldSystemAccessInput } from "@thuvien/shared";
import { oldSystemImportApi } from "@/lib/resources";

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["books"] });
  qc.invalidateQueries({ queryKey: ["categories"] });
  qc.invalidateQueries({ queryKey: ["authors"] });
  qc.invalidateQueries({ queryKey: ["patrons"] });
  qc.invalidateQueries({ queryKey: ["loans"] });
}

export function useImportOldSystemFromAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportOldSystemAccessInput) => oldSystemImportApi.importFromAccess(input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useImportOldSystemBooksFromExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => oldSystemImportApi.importBooksFromExcel(formData),
    onSuccess: () => invalidateAll(qc),
  });
}
