import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";
import { FINE_STATUSES } from "../constants";

export const fineSchema = z.object({
  id: z.string(),
  loanId: z.string(),
  patronId: z.string(),
  amount: z.number().int(),
  reason: z.string(),
  status: z.enum(FINE_STATUSES),
  paidAt: z.string().nullable(),
});
export type Fine = z.infer<typeof fineSchema>;

export const fineWithDetailsSchema = fineSchema.extend({
  patron: z.object({ id: z.string(), studentCode: z.string(), fullName: z.string() }),
  loan: z.object({
    id: z.string(),
    dueDate: z.string(),
    returnedAt: z.string().nullable(),
    book: z.object({ id: z.string(), title: z.string() }),
    copy: z.object({ id: z.string(), barcode: z.string() }),
  }),
});
export type FineWithDetails = z.infer<typeof fineWithDetailsSchema>;

export const fineQuerySchema = paginationQuerySchema.extend({
  status: z.enum(FINE_STATUSES).optional(),
  patronId: z.string().optional(),
});
export type FineQuery = z.infer<typeof fineQuerySchema>;
