import type { ApiClient } from "../api-client";
import type {
  CreateLoanInput,
  CreateLoansBatchInput,
  CreateLoansBatchResult,
  LoanQuery,
  LoanWithDetails,
  RenewLoanInput,
  ReturnByBarcodeInput,
} from "../schemas/loan.schema";

export interface PaginatedLoans {
  items: LoanWithDetails[];
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

export function createLoansApi(client: ApiClient) {
  return {
    list: (query: Partial<LoanQuery> = {}) =>
      client.get<PaginatedLoans>(`/api/v1/loans${toQueryString(query)}`),
    overdue: () => client.get<LoanWithDetails[]>("/api/v1/loans/overdue"),
    get: (id: string) => client.get<LoanWithDetails>(`/api/v1/loans/${id}`),
    create: (input: CreateLoanInput) => client.post<LoanWithDetails>("/api/v1/loans", input),
    createBatch: (input: CreateLoansBatchInput) =>
      client.post<CreateLoansBatchResult>("/api/v1/loans/batch", input),
    returnLoan: (id: string) => client.post<LoanWithDetails>(`/api/v1/loans/${id}/return`),
    returnByBarcode: (input: ReturnByBarcodeInput) =>
      client.post<LoanWithDetails>("/api/v1/loans/return-by-barcode", input),
    renew: (id: string, input: RenewLoanInput) =>
      client.post<LoanWithDetails>(`/api/v1/loans/${id}/renew`, input),
  };
}
