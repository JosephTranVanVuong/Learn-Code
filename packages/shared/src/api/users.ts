import type { ApiClient } from "../api-client";
import type { PaginationQuery } from "../schemas/common.schema";
import type {
  CreateUserInput,
  ResetUserPasswordInput,
  UpdateUserInput,
  User,
  UserQuery,
} from "../schemas/user.schema";

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

function toQueryString(query: Partial<UserQuery> & Partial<PaginationQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createUsersApi(client: ApiClient) {
  return {
    list: (query: Partial<UserQuery> = {}) => client.get<PaginatedUsers>(`/api/v1/users${toQueryString(query)}`),
    get: (id: string) => client.get<User>(`/api/v1/users/${id}`),
    create: (input: CreateUserInput) => client.post<User>("/api/v1/users", input),
    update: (id: string, input: UpdateUserInput) => client.patch<User>(`/api/v1/users/${id}`, input),
    resetPassword: (id: string, input: ResetUserPasswordInput) =>
      client.patch<{ success: boolean }>(`/api/v1/users/${id}/mat-khau`, input),
    deactivate: (id: string) => client.delete<void>(`/api/v1/users/${id}`),
    deletePermanently: (id: string) => client.delete<void>(`/api/v1/users/${id}/permanent`),
    uploadAvatar: (id: string, formData: FormData) => client.upload<User>(`/api/v1/users/${id}/avatar`, formData),
    removeAvatar: (id: string) => client.delete<User>(`/api/v1/users/${id}/avatar`),
  };
}
