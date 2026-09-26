import * as XLSX from "xlsx";
import { prisma, Prisma } from "@thuvien/database";
import type { BookImportResult } from "@thuvien/shared";
import { slugify } from "../../lib/slugify";
import { allocateBarcodes } from "../settings/service";

const TEMPLATE_HEADERS = [
  "Tên sách",
  "Tác giả",
  "Thể loại",
  "Nhà xuất bản",
  "Năm xuất bản",
  "ISBN",
  "Ngôn ngữ",
  "Mô tả",
  "Số bản sao",
];

export function generateImportTemplate(): Buffer {
  const sample = [
    TEMPLATE_HEADERS,
    [
      "Giáo lý Hội Thánh Công giáo",
      "Hội đồng Giám mục Việt Nam",
      "Thần học",
      "NXB Tôn Giáo",
      2020,
      "",
      "Tiếng Việt",
      "Mô tả ngắn gọn (tùy chọn)",
      2,
    ],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sample);
  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 26 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 32 },
    { wch: 10 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sach");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function readCell(row: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return undefined;
}

export async function importBooksFromExcel(buffer: Buffer): Promise<BookImportResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  const rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : [];

  const errors: BookImportResult["errors"] = [];
  const duplicates: BookImportResult["duplicates"] = [];
  const createdCategories: string[] = [];
  const createdAuthors: string[] = [];
  let successCount = 0;

  const existingCategories = await prisma.category.findMany();
  const categoryByName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));

  const existingAuthors = await prisma.author.findMany();
  const authorByName = new Map(existingAuthors.map((a) => [a.name.toLowerCase(), a.id]));

  const existingBooks = await prisma.book.findMany({
    where: { isDeleted: false },
    select: { title: true },
  });
  const existingTitles = new Set(existingBooks.map((b) => b.title.trim().toLowerCase()));

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i] ?? {};

    const title = readCell(row, ["Tên sách", "title"]);
    const author = readCell(row, ["Tác giả", "author"]);
    const categoryName = readCell(row, ["Thể loại", "category"]);

    if (!title || !author || !categoryName) {
      errors.push({ row: rowNum, title, message: "Thiếu Tên sách, Tác giả hoặc Thể loại" });
      continue;
    }

    const titleKey = title.toLowerCase();
    if (existingTitles.has(titleKey)) {
      duplicates.push({ row: rowNum, title });
      continue;
    }

    const publisher = readCell(row, ["Nhà xuất bản", "publisher"]);
    const isbn = readCell(row, ["ISBN", "isbn"]);
    const language = readCell(row, ["Ngôn ngữ", "language"]);
    const description = readCell(row, ["Mô tả", "description"]);
    const publishedYearRaw = readCell(row, ["Năm xuất bản", "publishedYear"]);
    const initialCopiesRaw = readCell(row, ["Số bản sao", "initialCopies"]);

    let publishedYear: number | undefined;
    if (publishedYearRaw) {
      publishedYear = Number.parseInt(publishedYearRaw, 10);
      if (Number.isNaN(publishedYear)) {
        errors.push({ row: rowNum, title, message: "Năm xuất bản không hợp lệ" });
        continue;
      }
    }

    let initialCopies = 1;
    if (initialCopiesRaw) {
      initialCopies = Number.parseInt(initialCopiesRaw, 10);
      if (Number.isNaN(initialCopies) || initialCopies < 0 || initialCopies > 50) {
        errors.push({ row: rowNum, title, message: "Số bản sao phải là số từ 0 đến 50" });
        continue;
      }
    }

    try {
      const key = categoryName.toLowerCase();
      let categoryId = categoryByName.get(key);
      if (!categoryId) {
        const baseSlug = slugify(categoryName) || "the-loai";
        let slug = baseSlug;
        let attempt = 1;
        while (await prisma.category.findUnique({ where: { slug } })) {
          attempt += 1;
          slug = `${baseSlug}-${attempt}`;
        }
        const category = await prisma.category.create({ data: { name: categoryName, slug } });
        categoryId = category.id;
        categoryByName.set(key, categoryId);
        createdCategories.push(categoryName);
      }

      const authorKey = author.toLowerCase();
      let authorId = authorByName.get(authorKey);
      if (!authorId) {
        const authorRow = await prisma.author.create({ data: { name: author } });
        authorId = authorRow.id;
        authorByName.set(authorKey, authorId);
        createdAuthors.push(author);
      }

      const book = await prisma.book.create({
        data: {
          title,
          authorId,
          categoryId,
          publisher,
          publishedYear,
          isbn: isbn || undefined,
          language: language || "Tiếng Việt",
          description,
        },
      });

      if (initialCopies > 0) {
        const barcodes = await allocateBarcodes(book.id, initialCopies, 1);
        await prisma.bookCopy.createMany({
          data: barcodes.map((barcode) => ({ bookId: book.id, barcode })),
        });
      }

      existingTitles.add(titleKey);
      successCount += 1;
    } catch (err) {
      const isDuplicateIsbn =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      errors.push({
        row: rowNum,
        title,
        message: isDuplicateIsbn ? "ISBN đã tồn tại trong thư viện" : "Không thể tạo sách do lỗi không xác định",
      });
    }
  }

  return {
    totalRows: rows.length,
    successCount,
    duplicateCount: duplicates.length,
    failedCount: errors.length,
    createdCategories: [...new Set(createdCategories)],
    createdAuthors: [...new Set(createdAuthors)],
    duplicates,
    errors,
  };
}
