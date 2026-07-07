import type { ApiClient } from "../api-client";
import type { Author, CreateAuthorInput, UpdateAuthorInput } from "../schemas/author.schema";

export function createAuthorsApi(client: ApiClient) {
  return {
    list: () => client.get<Author[]>("/api/v1/authors"),
    create: (input: CreateAuthorInput) => client.post<Author>("/api/v1/authors", input),
    update: (id: string, input: UpdateAuthorInput) =>
      client.patch<Author>(`/api/v1/authors/${id}`, input),
    remove: (id: string) => client.delete<void>(`/api/v1/authors/${id}`),
  };
}
