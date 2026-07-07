import type { ApiClient } from "../api-client";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "../schemas/category.schema";

export function createCategoriesApi(client: ApiClient) {
  return {
    list: () => client.get<Category[]>("/api/v1/categories"),
    create: (input: CreateCategoryInput) => client.post<Category>("/api/v1/categories", input),
    update: (id: string, input: UpdateCategoryInput) =>
      client.patch<Category>(`/api/v1/categories/${id}`, input),
    remove: (id: string) => client.delete<void>(`/api/v1/categories/${id}`),
  };
}
