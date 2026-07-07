import type { ApiClient } from "../api-client";
import type {
  DeleteAllDataInput,
  DeleteBooksDataResult,
  DeleteLoansFinesResult,
  DeletePatronsDataResult,
} from "../schemas/data-management.schema";

export function createDataManagementApi(client: ApiClient) {
  return {
    deleteLoansFines: () => client.post<DeleteLoansFinesResult>("/api/v1/data-management/loans-fines"),
    deletePatrons: () => client.post<DeletePatronsDataResult>("/api/v1/data-management/patrons"),
    deleteBooks: () => client.post<DeleteBooksDataResult>("/api/v1/data-management/books"),
    deleteCategoriesAuthors: () =>
      client.post<{ success: boolean }>("/api/v1/data-management/categories-authors"),
    deleteAll: (input: DeleteAllDataInput) =>
      client.post<{ success: boolean }>("/api/v1/data-management/all", input),
  };
}
