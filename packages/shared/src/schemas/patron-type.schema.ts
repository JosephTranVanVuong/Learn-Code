import { z } from "zod";

export const patronTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxActiveLoans: z.number().int().positive(),
  loanPeriodDays: z.number().int().positive(),
  maxRenewals: z.number().int().min(0),
  isDefault: z.boolean(),
});
export type PatronType = z.infer<typeof patronTypeSchema>;

export const createPatronTypeInputSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên loại độc giả"),
  maxActiveLoans: z.number().int().positive(),
  loanPeriodDays: z.number().int().positive(),
  maxRenewals: z.number().int().min(0),
});
export type CreatePatronTypeInput = z.infer<typeof createPatronTypeInputSchema>;

export const updatePatronTypeInputSchema = z.object({
  name: z.string().min(1).optional(),
  maxActiveLoans: z.number().int().positive().optional(),
  loanPeriodDays: z.number().int().positive().optional(),
  maxRenewals: z.number().int().min(0).optional(),
});
export type UpdatePatronTypeInput = z.infer<typeof updatePatronTypeInputSchema>;
