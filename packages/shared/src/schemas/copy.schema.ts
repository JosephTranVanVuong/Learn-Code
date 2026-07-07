import { z } from "zod";
import { COPY_STATUSES } from "../constants";

export const copySchema = z.object({
  id: z.string(),
  bookId: z.string(),
  barcode: z.string(),
  status: z.enum(COPY_STATUSES),
  location: z.string().nullable(),
  notes: z.string().nullable(),
});
export type Copy = z.infer<typeof copySchema>;

export const copyLookupSchema = copySchema.extend({
  book: z.object({ id: z.string(), title: z.string(), author: z.string() }),
});
export type CopyLookup = z.infer<typeof copyLookupSchema>;

export const createCopiesInputSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(50).default(1),
  location: z.string().optional(),
});
export type CreateCopiesInput = z.infer<typeof createCopiesInputSchema>;

export const updateCopyInputSchema = z.object({
  status: z.enum(COPY_STATUSES).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateCopyInput = z.infer<typeof updateCopyInputSchema>;

export const updateBookCopiesLocationInputSchema = z.object({
  location: z.string(),
});
export type UpdateBookCopiesLocationInput = z.infer<typeof updateBookCopiesLocationInputSchema>;
