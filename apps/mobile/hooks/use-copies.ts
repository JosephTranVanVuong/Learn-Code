import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCopiesInput, UpdateCopyInput } from "@thuvien/shared";
import { copiesApi } from "../lib/resources";

export function useAddCopies(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCopiesInput) => copiesApi.addCopies(bookId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books", "detail", bookId] }),
  });
}

export function useUpdateCopy(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCopyInput }) => copiesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books", "detail", bookId] }),
  });
}

export function useDeleteCopy(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => copiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books", "detail", bookId] }),
  });
}
