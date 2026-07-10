import type { ApiClient } from "../api-client";
import type { PaginationQuery } from "../schemas/common.schema";
import type {
  BookDetail,
  BookImportResult,
  BookQuery,
  BookWithAvailability,
  CreateBookInput,
  UpdateBookInput,
} from "../schemas/book.schema";
import type {
  BarcodeExportSummaryItem,
  ExportBarcodesBulkInput,
  ExportSpineLabelsBulkInput,
  SpineLabelExportSummaryItem,
  UpdateBookCopiesLocationInput,
} from "../schemas/copy.schema";

export interface PaginatedBooks {
  items: BookWithAvailability[];
  total: number;
  page: number;
  pageSize: number;
}

function toQueryString(query: Partial<BookQuery> & Partial<PaginationQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createBooksApi(client: ApiClient) {
  return {
    list: (query: Partial<BookQuery> = {}) =>
      client.get<PaginatedBooks>(`/api/v1/books${toQueryString(query)}`),
    get: (id: string) => client.get<BookDetail>(`/api/v1/books/${id}`),
    create: (input: CreateBookInput) => client.post<BookDetail>("/api/v1/books", input),
    update: (id: string, input: UpdateBookInput) =>
      client.patch<BookDetail>(`/api/v1/books/${id}`, input),
    updateCopiesLocation: (id: string, input: UpdateBookCopiesLocationInput) =>
      client.patch<BookDetail>(`/api/v1/books/${id}/copies-location`, input),
    remove: (id: string) => client.delete<void>(`/api/v1/books/${id}`),
    uploadCover: (id: string, formData: FormData) =>
      client.upload<BookDetail>(`/api/v1/books/${id}/cover`, formData),
    removeCover: (id: string) => client.delete<BookDetail>(`/api/v1/books/${id}/cover`),
    downloadImportTemplate: () => client.getBlob("/api/v1/books/import/template"),
    importFromExcel: (formData: FormData) =>
      client.upload<BookImportResult>("/api/v1/books/import", formData),
    exportAllBooks: () => client.getBlob("/api/v1/books/export"),
    barcodeExportSummary: (query: { search?: string; categoryId?: string } = {}) =>
      client.get<BarcodeExportSummaryItem[]>(`/api/v1/books/barcode-export-summary${toQueryString(query)}`),
    exportBarcodesBulk: (input: ExportBarcodesBulkInput) =>
      client.postBlob("/api/v1/books/export-barcodes-bulk", input),
    spineLabelExportSummary: (query: { search?: string; categoryId?: string } = {}) =>
      client.get<SpineLabelExportSummaryItem[]>(`/api/v1/books/spine-label-export-summary${toQueryString(query)}`),
    exportSpineLabelsBulk: (input: ExportSpineLabelsBulkInput) =>
      client.postBlob("/api/v1/books/export-spine-labels-bulk", input),
  };
}
