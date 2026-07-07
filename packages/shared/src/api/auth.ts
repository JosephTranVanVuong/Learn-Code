import type { ApiClient } from "../api-client";
import type { ChangePasswordInput } from "../schemas/auth.schema";

export function createAuthApi(client: ApiClient) {
  return {
    changePassword: (input: ChangePasswordInput) =>
      client.post<{ success: boolean }>("/api/v1/auth/change-password", input),
  };
}
