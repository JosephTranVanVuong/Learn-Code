import { z } from "zod";

export const DELETE_ALL_CONFIRMATION_PHRASE = "XOA TOAN BO";
export const DELETE_LOANS_FINES_CONFIRMATION_PHRASE = "XOA MUON TRA";
export const DELETE_PATRONS_CONFIRMATION_PHRASE = "XOA DOC GIA";
export const DELETE_BOOKS_CONFIRMATION_PHRASE = "XOA SACH";
export const DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE = "XOA THE LOAI";

export const deleteWithConfirmationInputSchema = z.object({
  confirmationPhrase: z.string().min(1, "Vui lòng nhập cụm từ xác nhận"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type DeleteWithConfirmationInput = z.infer<typeof deleteWithConfirmationInputSchema>;

export const deleteLoansFinesResultSchema = z.object({
  deletedLoans: z.number().int(),
  deletedFines: z.number().int(),
});
export type DeleteLoansFinesResult = z.infer<typeof deleteLoansFinesResultSchema>;

export const deletePatronsDataResultSchema = z.object({
  deletedPatrons: z.number().int(),
});
export type DeletePatronsDataResult = z.infer<typeof deletePatronsDataResultSchema>;

export const deleteBooksDataResultSchema = z.object({
  deletedBooks: z.number().int(),
});
export type DeleteBooksDataResult = z.infer<typeof deleteBooksDataResultSchema>;

export const deleteCategoriesAuthorsResultSchema = z.object({
  deletedCategories: z.number().int(),
  deletedAuthors: z.number().int(),
});
export type DeleteCategoriesAuthorsResult = z.infer<typeof deleteCategoriesAuthorsResultSchema>;

export const deleteAllDataResultSchema = z.object({
  deletedLoans: z.number().int(),
  deletedFines: z.number().int(),
  deletedPatrons: z.number().int(),
  deletedBooks: z.number().int(),
  deletedCategories: z.number().int(),
  deletedAuthors: z.number().int(),
});
export type DeleteAllDataResult = z.infer<typeof deleteAllDataResultSchema>;

export const deleteDataCountsSchema = z.object({
  loans: z.number().int(),
  fines: z.number().int(),
  patrons: z.number().int(),
  books: z.number().int(),
  bookCopies: z.number().int(),
  categories: z.number().int(),
  authors: z.number().int(),
});
export type DeleteDataCounts = z.infer<typeof deleteDataCountsSchema>;

export const dataDeletionLogEntrySchema = z.object({
  id: z.string(),
  actorName: z.string(),
  action: z.string(),
  summary: z.string(),
  createdAt: z.string(),
});
export type DataDeletionLogEntry = z.infer<typeof dataDeletionLogEntrySchema>;
