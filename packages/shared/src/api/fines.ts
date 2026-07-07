import type { ApiClient } from "../api-client";
import type { FineQuery, FineWithDetails } from "../schemas/fine.schema";

export interface PaginatedFines {
  items: FineWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

function toQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createFinesApi(client: ApiClient) {
  return {
    list: (query: Partial<FineQuery> = {}) =>
      client.get<PaginatedFines>(`/api/v1/fines${toQueryString(query)}`),
    mine: () => client.get<FineWithDetails[]>("/api/v1/fines/me"),
    get: (id: string) => client.get<FineWithDetails>(`/api/v1/fines/${id}`),
    pay: (id: string) => client.post<FineWithDetails>(`/api/v1/fines/${id}/pay`),
    waive: (id: string) => client.patch<FineWithDetails>(`/api/v1/fines/${id}/waive`),
  };
}
