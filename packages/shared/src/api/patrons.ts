import type { ApiClient } from "../api-client";
import type {
  CreatePatronInput,
  Patron,
  PatronImportResult,
  PatronQuery,
  ResetPatronPasswordInput,
  UpdatePatronInput,
} from "../schemas/patron.schema";
import type { LoanWithDetails } from "../schemas/loan.schema";

export interface PaginatedPatrons {
  items: Patron[];
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

export function createPatronsApi(client: ApiClient) {
  return {
    list: (query: Partial<PatronQuery> = {}) =>
      client.get<PaginatedPatrons>(`/api/v1/patrons${toQueryString(query)}`),
    get: (id: string) => client.get<Patron>(`/api/v1/patrons/${id}`),
    create: (input: CreatePatronInput) => client.post<Patron>("/api/v1/patrons", input),
    update: (id: string, input: UpdatePatronInput) =>
      client.patch<Patron>(`/api/v1/patrons/${id}`, input),
    resetPassword: (id: string, input: ResetPatronPasswordInput) =>
      client.patch<{ success: boolean }>(`/api/v1/patrons/${id}/mat-khau`, input),
    deactivate: (id: string) => client.delete<void>(`/api/v1/patrons/${id}`),
    deletePermanently: (id: string) => client.delete<void>(`/api/v1/patrons/${id}/permanent`),
    loans: (id: string) => client.get<LoanWithDetails[]>(`/api/v1/patrons/${id}/loans`),
    myLoans: () => client.get<LoanWithDetails[]>("/api/v1/patrons/me/loans"),
    uploadAvatar: (id: string, formData: FormData) =>
      client.upload<Patron>(`/api/v1/patrons/${id}/avatar`, formData),
    removeAvatar: (id: string) => client.delete<Patron>(`/api/v1/patrons/${id}/avatar`),
    getByCode: (studentCode: string) =>
      client.get<Patron>(`/api/v1/patrons/by-code/${encodeURIComponent(studentCode)}`),
    downloadImportTemplate: () => client.getBlob("/api/v1/patrons/import/template"),
    importFromExcel: (formData: FormData) =>
      client.upload<PatronImportResult>("/api/v1/patrons/import", formData),
  };
}
