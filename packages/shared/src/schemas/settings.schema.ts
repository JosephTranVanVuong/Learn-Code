import { z } from "zod";

export const librarySettingsSchema = z.object({
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  logoUrl: z.string().nullable(),
});
export type LibrarySettings = z.infer<typeof librarySettingsSchema>;

export const updateLibrarySettingsInputSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên thư viện").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
});
export type UpdateLibrarySettingsInput = z.infer<typeof updateLibrarySettingsInputSchema>;

export const fineSettingsSchema = z.object({
  finePerDayVnd: z.number().int().nonnegative(),
});
export type FineSettings = z.infer<typeof fineSettingsSchema>;

export const updateFineSettingsInputSchema = z.object({
  finePerDayVnd: z.number().int().nonnegative(),
});
export type UpdateFineSettingsInput = z.infer<typeof updateFineSettingsInputSchema>;

export const barcodeSettingsSchema = z.object({
  prefix: z.string().nullable(),
});
export type BarcodeSettings = z.infer<typeof barcodeSettingsSchema>;

export const updateBarcodeSettingsInputSchema = z.object({
  prefix: z.string().nullable().optional(),
});
export type UpdateBarcodeSettingsInput = z.infer<typeof updateBarcodeSettingsInputSchema>;

export const emailStatusSchema = z.object({
  configured: z.boolean(),
  host: z.string().nullable(),
  port: z.number().int().nullable(),
  from: z.string().nullable(),
});
export type EmailStatus = z.infer<typeof emailStatusSchema>;

export const sendTestEmailInputSchema = z.object({
  to: z.string().email("Email không hợp lệ"),
});
export type SendTestEmailInput = z.infer<typeof sendTestEmailInputSchema>;
