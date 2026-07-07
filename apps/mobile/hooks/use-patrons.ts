import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePatronInput,
  PatronQuery,
  ResetPatronPasswordInput,
  UpdatePatronInput,
} from "@thuvien/shared";
import { patronsApi } from "../lib/resources";

export function usePatrons(query: Partial<PatronQuery>) {
  return useQuery({
    queryKey: ["patrons", "list", query],
    queryFn: () => patronsApi.list(query),
  });
}

export function usePatron(id: string | undefined) {
  return useQuery({
    queryKey: ["patrons", "detail", id],
    queryFn: () => patronsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function usePatronLoans(id: string | undefined) {
  return useQuery({
    queryKey: ["patrons", "loans", id],
    queryFn: () => patronsApi.loans(id as string),
    enabled: Boolean(id),
  });
}

export function useMyLoans() {
  return useQuery({
    queryKey: ["patrons", "myLoans"],
    queryFn: () => patronsApi.myLoans(),
  });
}

export function useCreatePatron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatronInput) => patronsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}

export function useUpdatePatron(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePatronInput) => patronsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}

export function useResetPatronPassword(id: string) {
  return useMutation({
    mutationFn: (input: ResetPatronPasswordInput) => patronsApi.resetPassword(id, input),
  });
}

export function useDeactivatePatron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patronsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}

export function useDeletePatronPermanently() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patronsApi.deletePermanently(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}

export function useUploadPatronAvatar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => patronsApi.uploadAvatar(id, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}

export function useRemovePatronAvatar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => patronsApi.removeAvatar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}

export function useImportPatronsFromExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => patronsApi.importFromExcel(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrons"] }),
  });
}
