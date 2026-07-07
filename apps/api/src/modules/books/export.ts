import * as XLSX from "xlsx";
import { prisma } from "@thuvien/database";

const EXPORT_HEADERS = [
  "Tên sách",
  "Tác giả",
  "Thể loại",
  "Nhà xuất bản",
  "Năm xuất bản",
  "ISBN",
  "Ngôn ngữ",
  "Mô tả",
  "Tổng số bản sao",
  "Số bản sao có sẵn",
  "Mã vạch các bản sao",
];

export async function exportBooksToExcel(): Promise<Buffer> {
  const books = await prisma.book.findMany({
    where: { isDeleted: false },
    include: { author: true, category: true, copies: true },
    orderBy: { title: "asc" },
  });

  const rows = books.map((book) => [
    book.title,
    book.author.name,
    book.category.name,
    book.publisher ?? "",
    book.publishedYear ?? "",
    book.isbn ?? "",
    book.language ?? "",
    book.description ?? "",
    book.copies.length,
    book.copies.filter((c) => c.status === "AVAILABLE").length,
    book.copies.map((c) => c.barcode).join(", "),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);
  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 26 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 32 },
    { wch: 14 },
    { wch: 16 },
    { wch: 32 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sach");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
