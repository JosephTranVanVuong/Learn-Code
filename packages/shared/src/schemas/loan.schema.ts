import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";
import { LOAN_STATUSES } from "../constants";
import { fineSchema } from "./fine.schema";

export const loanSchema = z.object({
  id: z.string(),
  copyId: z.string(),
  patronId: z.string(),
  borrowedAt: z.string(),
  dueDate: z.string(),
  returnedAt: z.string().nullable(),
  status: z.enum(LOAN_STATUSES),
  renewedCount: z.number().int(),
});
export type Loan = z.infer<typeof loanSchema>;

export const loanWithDetailsSchema = loanSchema.extend({
  copy: z.object({ id: z.string(), barcode: z.string(), bookId: z.string() }),
  book: z.object({ id: z.string(), title: z.string(), author: z.string() }),
  patron: z.object({ id: z.string(), studentCode: z.string(), fullName: z.string() }),
  fine: fineSchema.nullable(),
});
export type LoanWithDetails = z.infer<typeof loanWithDetailsSchema>;

export const createLoanInputSchema = z.object({
  copyId: z.string().min(1, "Vui lòng chọn bản sao"),
  patronId: z.string().min(1, "Vui lòng chọn độc giả"),
});
export type CreateLoanInput = z.infer<typeof createLoanInputSchema>;

export const createLoansBatchInputSchema = z.object({
  patronId: z.string().min(1, "Vui lòng chọn độc giả"),
  copyIds: z.array(z.string().min(1)).min(1, "Giỏ mượn sách đang trống"),
});
export type CreateLoansBatchInput = z.infer<typeof createLoansBatchInputSchema>;

export const createLoansBatchResultSchema = z.object({
  loans: z.array(loanWithDetailsSchema),
});
export type CreateLoansBatchResult = z.infer<typeof createLoansBatchResultSchema>;

export const renewLoanInputSchema = z.object({
  newDueDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Ngày gia hạn không hợp lệ"),
});
export type RenewLoanInput = z.infer<typeof renewLoanInputSchema>;

export const returnByBarcodeInputSchema = z.object({
  barcode: z.string().min(1, "Vui lòng quét hoặc nhập mã vạch"),
});
export type ReturnByBarcodeInput = z.infer<typeof returnByBarcodeInputSchema>;

export const loanQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LOAN_STATUSES).optional(),
  patronId: z.string().optional(),
  search: z.string().optional(),
});
export type LoanQuery = z.infer<typeof loanQuerySchema>;
