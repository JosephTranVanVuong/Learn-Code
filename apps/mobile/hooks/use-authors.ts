import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateAuthorInput, UpdateAuthorInput } from "@thuvien/shared";
import { authorsApi } from "../lib/resources";

export function useAuthors() {
  return useQuery({ queryKey: ["authors"], queryFn: authorsApi.list });
}

export function useCreateAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuthorInput) => authorsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authors"] }),
  });
}

export function useUpdateAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAuthorInput }) =>
      authorsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authors"] }),
  });
}

export function useDeleteAuthor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authorsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authors"] }),
  });
}
