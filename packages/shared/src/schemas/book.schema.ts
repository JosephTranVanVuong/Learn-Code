import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";
import { categorySchema } from "./category.schema";
import { authorSchema } from "./author.schema";
import { copySchema } from "./copy.schema";

export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  authorId: z.string(),
  publisher: z.string().nullable(),
  publishedYear: z.number().int().nullable(),
  isbn: z.string().nullable(),
  language: z.string().nullable(),
  description: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  categoryId: z.string(),
  classificationNumber: z.string().nullable(),
  authorMark: z.string().nullable(),
});
export type Book = z.infer<typeof bookSchema>;

export const bookWithAvailabilitySchema = bookSchema.extend({
  category: categorySchema,
  author: authorSchema,
  totalCopies: z.number().int(),
  availableCopies: z.number().int(),
});
export type BookWithAvailability = z.infer<typeof bookWithAvailabilitySchema>;

export const bookDetailSchema = bookWithAvailabilitySchema.extend({
  copies: z.array(copySchema),
});
export type BookDetail = z.infer<typeof bookDetailSchema>;

export const createBookInputSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tên sách"),
  authorId: z.string().min(1, "Vui lòng chọn tác giả"),
  categoryId: z.string().min(1, "Vui lòng chọn thể loại"),
  publisher: z.string().optional(),
  publishedYear: z.coerce.number().int().optional(),
  isbn: z.string().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  classificationNumber: z.string().optional(),
  authorMark: z.string().optional(),
  initialCopies: z.coerce.number().int().min(0).max(50).default(1),
  location: z.string().optional(),
});
export type CreateBookInput = z.infer<typeof createBookInputSchema>;

export const updateBookInputSchema = createBookInputSchema
  .omit({ initialCopies: true, location: true })
  .partial()
  .extend({
    coverImageUrl: z.string().nullable().optional(),
  });
export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

export const bookQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  availableOnly: z.coerce.boolean().optional(),
});
export type BookQuery = z.infer<typeof bookQuerySchema>;

export const bookImportRowErrorSchema = z.object({
  row: z.number().int(),
  title: z.string().optional(),
  message: z.string(),
});
export type BookImportRowError = z.infer<typeof bookImportRowErrorSchema>;

export const bookImportDuplicateSchema = z.object({
  row: z.number().int(),
  title: z.string(),
});
export type BookImportDuplicate = z.infer<typeof bookImportDuplicateSchema>;

export const bookImportResultSchema = z.object({
  totalRows: z.number().int(),
  successCount: z.number().int(),
  duplicateCount: z.number().int(),
  failedCount: z.number().int(),
  createdCategories: z.array(z.string()),
  createdAuthors: z.array(z.string()),
  duplicates: z.array(bookImportDuplicateSchema),
  errors: z.array(bookImportRowErrorSchema),
});
export type BookImportResult = z.infer<typeof bookImportResultSchema>;
