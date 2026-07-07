import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateUserInput,
  ResetUserPasswordInput,
  UpdateUserInput,
  UserQuery,
} from "@thuvien/shared";
import { usersApi } from "../lib/resources";

export function useUsers(query: Partial<UserQuery>) {
  return useQuery({
    queryKey: ["users", "list", query],
    queryFn: () => usersApi.list(query),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => usersApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useResetUserPassword(id: string) {
  return useMutation({
    mutationFn: (input: ResetUserPasswordInput) => usersApi.resetPassword(id, input),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUserPermanently() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deletePermanently(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
