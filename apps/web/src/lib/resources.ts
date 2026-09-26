import {
  createAuthApi,
  createAuthorsApi,
  createBooksApi,
  createCategoriesApi,
  createCopiesApi,
  createDataManagementApi,
  createFinesApi,
  createLoansApi,
  createNotificationsApi,
  createOldSystemImportApi,
  createPatronsApi,
  createPatronTypesApi,
  createReportsApi,
  createSettingsApi,
  createUsersApi,
} from "@thuvien/shared";
import { apiClient } from "./api-client";

export const authApi = createAuthApi(apiClient);
export const booksApi = createBooksApi(apiClient);
export const categoriesApi = createCategoriesApi(apiClient);
export const authorsApi = createAuthorsApi(apiClient);
export const copiesApi = createCopiesApi(apiClient);
export const patronsApi = createPatronsApi(apiClient);
export const patronTypesApi = createPatronTypesApi(apiClient);
export const loansApi = createLoansApi(apiClient);
export const finesApi = createFinesApi(apiClient);
export const reportsApi = createReportsApi(apiClient);
export const notificationsApi = createNotificationsApi(apiClient);
export const usersApi = createUsersApi(apiClient);
export const settingsApi = createSettingsApi(apiClient);
export const dataManagementApi = createDataManagementApi(apiClient);
export const oldSystemImportApi = createOldSystemImportApi(apiClient);
