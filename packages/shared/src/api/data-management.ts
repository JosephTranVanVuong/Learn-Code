import type { ApiClient } from "../api-client";
import type {
  DataDeletionLogEntry,
  DeleteAllDataResult,
  DeleteBooksDataResult,
  DeleteCategoriesAuthorsResult,
  DeleteDataCounts,
  DeleteLoansFinesResult,
  DeletePatronsDataResult,
  DeleteWithConfirmationInput,
} from "../schemas/data-management.schema";

export function createDataManagementApi(client: ApiClient) {
  return {
    getCounts: () => client.get<DeleteDataCounts>("/api/v1/data-management/counts"),
    getLogs: () => client.get<DataDeletionLogEntry[]>("/api/v1/data-management/logs"),

    deleteLoansFines: (input: DeleteWithConfirmationInput) =>
      client.post<DeleteLoansFinesResult>("/api/v1/data-management/loans-fines", input),
    deletePatrons: (input: DeleteWithConfirmationInput) =>
      client.post<DeletePatronsDataResult>("/api/v1/data-management/patrons", input),
    deleteBooks: (input: DeleteWithConfirmationInput) =>
      client.post<DeleteBooksDataResult>("/api/v1/data-management/books", input),
    deleteCategoriesAuthors: (input: DeleteWithConfirmationInput) =>
      client.post<DeleteCategoriesAuthorsResult>("/api/v1/data-management/categories-authors", input),
    deleteAll: (input: DeleteWithConfirmationInput) =>
      client.post<DeleteAllDataResult>("/api/v1/data-management/all", input),
  };
}
