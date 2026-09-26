import { z } from "zod";

/// Nhập dữ liệu từ phần mềm thư viện cũ (lược đồ Access TpTacPham*/DgDocGia/DgMuonTra),
/// hỗ trợ 2 nguồn: file Access (.accdb/.mdb, đọc trực tiếp trên máy chủ) hoặc file Excel
/// (báo cáo "Danh sách tổng quát" — chỉ có dữ liệu sách/mã vạch, không có độc giả/lượt mượn).
/// Hành vi: CỘNG THÊM, bỏ qua những gì đã tồn tại (không xóa/ghi đè dữ liệu hiện có).

export const importOldSystemAccessInputSchema = z.object({
  filePath: z.string().min(1, "Vui lòng nhập đường dẫn file .accdb"),
  importBooks: z.boolean().default(true),
  importPatrons: z.boolean().default(true),
  importLoans: z.boolean().default(true),
});
export type ImportOldSystemAccessInput = z.infer<typeof importOldSystemAccessInputSchema>;

export const oldSystemBookImportResultSchema = z.object({
  totalRows: z.number().int(),
  booksCreated: z.number().int(),
  copiesCreated: z.number().int(),
  copiesSkipped: z.number().int(),
  authorsCreated: z.number().int(),
  categoriesCreated: z.number().int(),
});
export type OldSystemBookImportResult = z.infer<typeof oldSystemBookImportResultSchema>;

export const oldSystemPatronImportResultSchema = z.object({
  totalRows: z.number().int(),
  patronsCreated: z.number().int(),
  patronsSkipped: z.number().int(),
});
export type OldSystemPatronImportResult = z.infer<typeof oldSystemPatronImportResultSchema>;

export const oldSystemLoanImportResultSchema = z.object({
  totalRows: z.number().int(),
  loansCreated: z.number().int(),
  loansSkipped: z.number().int(),
  skippedOrphanPatron: z.number().int(),
  skippedOrphanCopy: z.number().int(),
  skippedMissingDate: z.number().int(),
});
export type OldSystemLoanImportResult = z.infer<typeof oldSystemLoanImportResultSchema>;

export const oldSystemImportResultSchema = z.object({
  books: oldSystemBookImportResultSchema.nullable(),
  patrons: oldSystemPatronImportResultSchema.nullable(),
  loans: oldSystemLoanImportResultSchema.nullable(),
});
export type OldSystemImportResult = z.infer<typeof oldSystemImportResultSchema>;
