import * as XLSX from "xlsx";
import { prisma, type Prisma } from "@thuvien/database";

const EXPORT_HEADERS = [
  "Mã vạch",
  "Tên sách",
  "Tác giả",
  "Độc giả",
  "Mã số",
  "Lớp/Khóa",
  "Ngày mượn",
  "Hạn trả",
  "Trạng thái",
  "Số ngày quá hạn",
];

function formatDate(d: Date): string {
  return d.toLocaleDateString("vi-VN");
}

export async function exportActiveLoansToExcel(search?: string): Promise<Buffer> {
  const now = new Date();
  const where: Prisma.LoanWhereInput = {
    status: "ACTIVE",
    ...(search
      ? {
          OR: [
            { patron: { fullName: { contains: search } } },
            { patron: { studentCode: { contains: search } } },
            { copy: { barcode: { contains: search } } },
            { copy: { book: { title: { contains: search } } } },
          ],
        }
      : {}),
  };

  const loans = await prisma.loan.findMany({
    where,
    include: { copy: { include: { book: { include: { author: true } } } }, patron: true },
    orderBy: { dueDate: "asc" },
  });

  const rows = loans.map((loan) => {
    const isOverdue = loan.dueDate.getTime() < now.getTime();
    const daysOverdue = isOverdue
      ? Math.ceil((now.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000))
      : "";
    return [
      loan.copy.barcode,
      loan.copy.book.title,
      loan.copy.book.author.name,
      loan.patron.fullName,
      loan.patron.studentCode,
      loan.patron.className ?? "",
      formatDate(loan.borrowedAt),
      formatDate(loan.dueDate),
      isOverdue ? "Quá hạn" : "Đang mượn",
      daysOverdue,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DangMuon");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
