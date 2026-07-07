import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";

export const patronSchema = z.object({
  id: z.string(),
  studentCode: z.string(),
  fullName: z.string(),
  className: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
  patronTypeId: z.string().nullable(),
  patronTypeName: z.string().nullable(),
});
export type Patron = z.infer<typeof patronSchema>;

export const createPatronInputSchema = z.object({
  studentCode: z.string().min(1, "Vui lòng nhập mã số độc giả"),
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  className: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  patronTypeId: z.string().optional(),
});
export type CreatePatronInput = z.infer<typeof createPatronInputSchema>;

export const updatePatronInputSchema = z.object({
  fullName: z.string().min(1).optional(),
  className: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  isActive: z.boolean().optional(),
  patronTypeId: z.string().optional(),
});
export type UpdatePatronInput = z.infer<typeof updatePatronInputSchema>;

export const resetPatronPasswordInputSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
export type ResetPatronPasswordInput = z.infer<typeof resetPatronPasswordInputSchema>;

export const patronQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});
export type PatronQuery = z.infer<typeof patronQuerySchema>;

export const patronImportRowErrorSchema = z.object({
  row: z.number().int(),
  studentCode: z.string().optional(),
  message: z.string(),
});
export type PatronImportRowError = z.infer<typeof patronImportRowErrorSchema>;

export const patronImportDuplicateSchema = z.object({
  row: z.number().int(),
  studentCode: z.string(),
});
export type PatronImportDuplicate = z.infer<typeof patronImportDuplicateSchema>;

export const patronImportResultSchema = z.object({
  totalRows: z.number().int(),
  successCount: z.number().int(),
  duplicateCount: z.number().int(),
  failedCount: z.number().int(),
  duplicates: z.array(patronImportDuplicateSchema),
  errors: z.array(patronImportRowErrorSchema),
});
export type PatronImportResult = z.infer<typeof patronImportResultSchema>;
