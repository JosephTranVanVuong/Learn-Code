import { z } from "zod";

export const reportsOverviewSchema = z.object({
  totalBooks: z.number().int(),
  totalCopies: z.number().int(),
  totalPatrons: z.number().int(),
  activeLoans: z.number().int(),
  overdueLoans: z.number().int(),
  unpaidFinesCount: z.number().int(),
  unpaidFinesTotal: z.number().int(),
});
export type ReportsOverview = z.infer<typeof reportsOverviewSchema>;

export const mostBorrowedBookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  categoryName: z.string(),
  borrowCount: z.number().int(),
});
export type MostBorrowedBook = z.infer<typeof mostBorrowedBookSchema>;

export const overdueSummaryItemSchema = z.object({
  loanId: z.string(),
  bookTitle: z.string(),
  patronName: z.string(),
  studentCode: z.string(),
  dueDate: z.string(),
  daysOverdue: z.number().int(),
  estimatedFine: z.number().int(),
});
export type OverdueSummaryItem = z.infer<typeof overdueSummaryItemSchema>;

export const loansByPeriodPointSchema = z.object({
  date: z.string(),
  count: z.number().int(),
});
export type LoansByPeriodPoint = z.infer<typeof loansByPeriodPointSchema>;

export const patronActivityItemSchema = z.object({
  patronId: z.string(),
  studentCode: z.string(),
  fullName: z.string(),
  loanCount: z.number().int(),
});
export type PatronActivityItem = z.infer<typeof patronActivityItemSchema>;

export const reportsLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type ReportsLimitQuery = z.infer<typeof reportsLimitQuerySchema>;

export const reportsPeriodQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});
export type ReportsPeriodQuery = z.infer<typeof reportsPeriodQuerySchema>;
