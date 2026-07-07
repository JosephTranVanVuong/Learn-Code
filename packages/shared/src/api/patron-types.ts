import type { ApiClient } from "../api-client";
import type { CreatePatronTypeInput, PatronType, UpdatePatronTypeInput } from "../schemas/patron-type.schema";

export function createPatronTypesApi(client: ApiClient) {
  return {
    list: () => client.get<PatronType[]>("/api/v1/patron-types"),
    create: (input: CreatePatronTypeInput) => client.post<PatronType>("/api/v1/patron-types", input),
    update: (id: string, input: UpdatePatronTypeInput) =>
      client.patch<PatronType>(`/api/v1/patron-types/${id}`, input),
    setDefault: (id: string) => client.post<PatronType>(`/api/v1/patron-types/${id}/set-default`),
    remove: (id: string) => client.delete<void>(`/api/v1/patron-types/${id}`),
  };
}
