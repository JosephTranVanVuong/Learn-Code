import type { ApiClient } from "../api-client";
import type { Copy, CopyLookup, CreateCopiesInput, UpdateCopyInput } from "../schemas/copy.schema";

export function createCopiesApi(client: ApiClient) {
  return {
    listForBook: (bookId: string) => client.get<Copy[]>(`/api/v1/books/${bookId}/copies`),
    addCopies: (bookId: string, input: CreateCopiesInput) =>
      client.post<Copy[]>(`/api/v1/books/${bookId}/copies`, input),
    update: (id: string, input: UpdateCopyInput) => client.patch<Copy>(`/api/v1/copies/${id}`, input),
    remove: (id: string) => client.delete<void>(`/api/v1/copies/${id}`),
    getByBarcode: (barcode: string) =>
      client.get<CopyLookup>(`/api/v1/copies/by-barcode/${encodeURIComponent(barcode)}`),
  };
}
