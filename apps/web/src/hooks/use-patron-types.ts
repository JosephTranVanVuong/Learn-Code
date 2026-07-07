"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatePatronTypeInput, UpdatePatronTypeInput } from "@thuvien/shared";
import { patronTypesApi } from "@/lib/resources";

export function usePatronTypes() {
  return useQuery({
    queryKey: ["patron-types", "list"],
    queryFn: () => patronTypesApi.list(),
  });
}

export function useCreatePatronType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatronTypeInput) => patronTypesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patron-types"] }),
  });
}

export function useUpdatePatronType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePatronTypeInput) => patronTypesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patron-types"] }),
  });
}

export function useSetDefaultPatronType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patronTypesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patron-types"] }),
  });
}

export function useDeletePatronType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patronTypesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patron-types"] }),
  });
}
