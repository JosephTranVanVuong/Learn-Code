import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BookQuery, CreateBookInput, UpdateBookCopiesLocationInput, UpdateBookInput } from "@thuvien/shared";
import { booksApi } from "../lib/resources";

export function useBooks(query: Partial<BookQuery>) {
  return useQuery({
    queryKey: ["books", "list", query],
    queryFn: () => booksApi.list(query),
  });
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: ["books", "detail", id],
    queryFn: () => booksApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookInput) => booksApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useUpdateBook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBookInput) => booksApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useUpdateBookCopiesLocation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBookCopiesLocationInput) => booksApi.updateCopiesLocation(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => booksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useUploadBookCover(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => booksApi.uploadCover(id, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useRemoveBookCover(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => booksApi.removeCover(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useImportBooksFromExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => booksApi.importFromExcel(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
