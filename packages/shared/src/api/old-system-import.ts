import type { ApiClient } from "../api-client";
import type {
  ImportOldSystemAccessInput,
  OldSystemBookImportResult,
  OldSystemImportResult,
} from "../schemas/old-system-import.schema";

export function createOldSystemImportApi(client: ApiClient) {
  return {
    importFromAccess: (input: ImportOldSystemAccessInput) =>
      client.post<OldSystemImportResult>("/api/v1/old-system-import/access", input),
    importBooksFromExcel: (formData: FormData) =>
      client.upload<OldSystemBookImportResult>("/api/v1/old-system-import/excel", formData),
  };
}
