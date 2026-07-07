import { z } from "zod";

export const DELETE_ALL_CONFIRMATION_PHRASE = "XOA TOAN BO";

export const deleteAllDataInputSchema = z.object({
  confirmationPhrase: z.string().min(1, "Vui lòng nhập cụm từ xác nhận"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type DeleteAllDataInput = z.infer<typeof deleteAllDataInputSchema>;

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
