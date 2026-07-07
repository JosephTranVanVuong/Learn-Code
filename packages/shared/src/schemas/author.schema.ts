import { z } from "zod";

export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  bookCount: z.number().int().optional(),
});
export type Author = z.infer<typeof authorSchema>;

export const createAuthorInputSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên tác giả"),
});
export type CreateAuthorInput = z.infer<typeof createAuthorInputSchema>;

export const updateAuthorInputSchema = createAuthorInputSchema.partial();
export type UpdateAuthorInput = z.infer<typeof updateAuthorInputSchema>;
