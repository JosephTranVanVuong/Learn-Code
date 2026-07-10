import { prisma, type Prisma } from "@thuvien/database";
import type {
  BarcodeExportSummaryItem,
  BookDetail,
  BookQuery,
  BookWithAvailability,
  CreateBookInput,
  SpineLabelExportSummaryItem,
  UpdateBookInput,
} from "@thuvien/shared";
import { generateBarcode } from "../../lib/barcode";
import { getBarcodePrefix } from "../settings/service";

type BookRow = Prisma.BookGetPayload<{ include: { category: true; author: true; copies: true } }>;

function toBookWithAvailability(row: BookRow): BookWithAvailability {
  const totalCopies = row.copies.length;
  const availableCopies = row.copies.filter((c) => c.status === "AVAILABLE").length;
  return {
    id: row.id,
    title: row.title,
    authorId: row.authorId,
    publisher: row.publisher,
    publishedYear: row.publishedYear,
    isbn: row.isbn,
    language: row.language,
    description: row.description,
    coverImageUrl: row.coverImageUrl,
    categoryId: row.categoryId,
    classificationNumber: row.classificationNumber,
    authorMark: row.authorMark,
    category: { id: row.category.id, name: row.category.name, slug: row.category.slug, ddcPrefix: row.category.ddcPrefix },
    author: { id: row.author.id, name: row.author.name },
    totalCopies,
    availableCopies,
  };
}

function toBookDetail(row: BookRow): BookDetail {
  return {
    ...toBookWithAvailability(row),
    copies: row.copies.map((c) => ({
      id: c.id,
      bookId: c.bookId,
      barcode: c.barcode,
      status: c.status as BookDetail["copies"][number]["status"],
      location: c.location,
      notes: c.notes,
      barcodePrintedAt: c.barcodePrintedAt?.toISOString() ?? null,
      spineLabelPrintedAt: c.spineLabelPrintedAt?.toISOString() ?? null,
    })),
  };
}

export async function getBarcodeExportSummary(query: {
  search?: string;
  categoryId?: string;
}): Promise<BarcodeExportSummaryItem[]> {
  const rows = await prisma.book.findMany({
    where: {
      isDeleted: false,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search ? { title: { contains: query.search } } : {}),
    },
    include: { author: true, category: true, copies: true },
    orderBy: { title: "asc" },
  });

  return rows
    .filter((row) => row.copies.length > 0)
    .map((row) => ({
      bookId: row.id,
      title: row.title,
      authorName: row.author.name,
      categoryName: row.category.name,
      totalCopies: row.copies.length,
      unprintedCopies: row.copies.filter((c) => !c.barcodePrintedAt).length,
    }));
}

export async function getSpineLabelExportSummary(query: {
  search?: string;
  categoryId?: string;
}): Promise<SpineLabelExportSummaryItem[]> {
  const rows = await prisma.book.findMany({
    where: {
      isDeleted: false,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search ? { title: { contains: query.search } } : {}),
    },
    include: { author: true, category: true, copies: true },
    orderBy: { title: "asc" },
  });

  return rows
    .filter((row) => row.copies.length > 0)
    .map((row) => ({
      bookId: row.id,
      title: row.title,
      authorName: row.author.name,
      categoryName: row.category.name,
      classificationNumber: row.classificationNumber,
      authorMark: row.authorMark,
      totalCopies: row.copies.length,
      unprintedCopies: row.copies.filter((c) => !c.spineLabelPrintedAt).length,
    }));
}

export async function listBooks(query: BookQuery) {
  const where: Prisma.BookWhereInput = {
    isDeleted: false,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.authorId ? { authorId: query.authorId } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search } },
            { author: { name: { contains: query.search } } },
          ],
        }
      : {}),
    ...(query.availableOnly ? { copies: { some: { status: "AVAILABLE" } } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      include: { category: true, author: true, copies: true },
      orderBy: { title: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map(toBookWithAvailability),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getBook(id: string): Promise<BookDetail | null> {
  const row = await prisma.book.findFirst({
    where: { id, isDeleted: false },
    include: { category: true, author: true, copies: true },
  });
  if (!row) return null;
  return toBookDetail(row);
}

export async function createBook(input: CreateBookInput): Promise<BookDetail> {
  const book = await prisma.book.create({
    data: {
      title: input.title,
      authorId: input.authorId,
      categoryId: input.categoryId,
      publisher: input.publisher,
      publishedYear: input.publishedYear,
      isbn: input.isbn,
      language: input.language,
      description: input.description,
      classificationNumber: input.classificationNumber,
      authorMark: input.authorMark,
    },
  });

  if (input.initialCopies > 0) {
    const prefix = await getBarcodePrefix();
    await prisma.bookCopy.createMany({
      data: Array.from({ length: input.initialCopies }, (_, i) => ({
        bookId: book.id,
        barcode: generateBarcode(book.id, i + 1, prefix),
        location: input.location,
      })),
    });
  }

  const detail = await getBook(book.id);
  return detail!;
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<BookDetail | null> {
  const existing = await prisma.book.findFirst({ where: { id, isDeleted: false } });
  if (!existing) return null;
  await prisma.book.update({
    where: { id },
    data: {
      title: input.title,
      authorId: input.authorId,
      categoryId: input.categoryId,
      publisher: input.publisher,
      publishedYear: input.publishedYear,
      isbn: input.isbn,
      language: input.language,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      classificationNumber: input.classificationNumber,
      authorMark: input.authorMark,
    },
  });
  return getBook(id);
}

export async function updateBookCover(id: string, coverImageUrl: string | null): Promise<BookDetail | null> {
  const existing = await prisma.book.findFirst({ where: { id, isDeleted: false } });
  if (!existing) return null;
  await prisma.book.update({ where: { id }, data: { coverImageUrl } });
  return getBook(id);
}

export async function deleteBook(id: string): Promise<boolean> {
  const existing = await prisma.book.findFirst({ where: { id, isDeleted: false } });
  if (!existing) return false;
  await prisma.book.update({ where: { id }, data: { isDeleted: true } });
  return true;
}
