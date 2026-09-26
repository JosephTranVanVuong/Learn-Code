import { prisma } from "@thuvien/database";
import type { Copy, CopyLookup, CreateCopiesInput, UpdateCopyInput } from "@thuvien/shared";
import { allocateBarcodes } from "../settings/service";
import { generateBarcodeDocxBuffer } from "./barcode-docx";
import { generateSpineLabelDocxBuffer } from "./spine-label-docx";

function toCopy(row: {
  id: string;
  bookId: string;
  barcode: string;
  status: string;
  location: string | null;
  notes: string | null;
  barcodePrintedAt: Date | null;
  spineLabelPrintedAt: Date | null;
}): Copy {
  return {
    id: row.id,
    bookId: row.bookId,
    barcode: row.barcode,
    status: row.status as Copy["status"],
    location: row.location,
    notes: row.notes,
    barcodePrintedAt: row.barcodePrintedAt?.toISOString() ?? null,
    spineLabelPrintedAt: row.spineLabelPrintedAt?.toISOString() ?? null,
  };
}

export async function getCopyByBarcode(barcode: string): Promise<CopyLookup | null> {
  const row = await prisma.bookCopy.findUnique({
    where: { barcode },
    include: { book: { include: { author: true } } },
  });
  if (!row) return null;
  return {
    ...toCopy(row),
    book: { id: row.book.id, title: row.book.title, author: row.book.author.name },
  };
}

export async function listCopiesForBook(bookId: string): Promise<Copy[]> {
  const rows = await prisma.bookCopy.findMany({
    where: { bookId },
    orderBy: { barcode: "asc" },
  });
  return rows.map(toCopy);
}

export async function addCopies(bookId: string, input: CreateCopiesInput): Promise<Copy[] | null> {
  const book = await prisma.book.findFirst({ where: { id: bookId, isDeleted: false } });
  if (!book) return null;

  const existingCount = await prisma.bookCopy.count({ where: { bookId } });
  const barcodes = await allocateBarcodes(bookId, input.quantity, existingCount + 1);
  await prisma.bookCopy.createMany({
    data: barcodes.map((barcode) => ({
      bookId,
      barcode,
      location: input.location,
    })),
  });

  return listCopiesForBook(bookId);
}

export async function updateCopy(id: string, input: UpdateCopyInput): Promise<Copy | null> {
  const existing = await prisma.bookCopy.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.bookCopy.update({
    where: { id },
    data: {
      status: input.status ?? existing.status,
      location: input.location ?? existing.location,
      notes: input.notes ?? existing.notes,
    },
  });
  return toCopy(row);
}

export async function updateAllCopiesLocationForBook(bookId: string, location: string): Promise<void> {
  await prisma.bookCopy.updateMany({ where: { bookId }, data: { location } });
}

export async function deleteCopy(id: string): Promise<"ok" | "not_found" | "borrowed"> {
  const existing = await prisma.bookCopy.findUnique({ where: { id } });
  if (!existing) return "not_found";
  if (existing.status === "BORROWED") return "borrowed";
  await prisma.bookCopy.delete({ where: { id } });
  return "ok";
}

/** Xuất file .docx in nhãn cho đúng các bản sao được chọn (giữ nguyên thứ tự truyền vào), đánh dấu đã in. */
export async function exportBarcodesForCopies(copyIds: string[]): Promise<Buffer | null> {
  const rows = await prisma.bookCopy.findMany({ where: { id: { in: copyIds } } });
  if (rows.length === 0) return null;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = copyIds.map((id) => byId.get(id)).filter((r): r is (typeof rows)[number] => Boolean(r));

  const buffer = await generateBarcodeDocxBuffer(ordered.map((r) => ({ barcode: r.barcode, location: r.location })));
  await prisma.bookCopy.updateMany({
    where: { id: { in: ordered.map((r) => r.id) } },
    data: { barcodePrintedAt: new Date() },
  });
  return buffer;
}

/** Xuất file .docx in nhãn cho toàn bộ bản sao thuộc các sách được chọn, tùy chọn chỉ lấy bản sao chưa in. */
export async function exportBarcodesBulkForBooks(bookIds: string[], onlyUnprinted: boolean): Promise<Buffer | null> {
  const rows = await prisma.bookCopy.findMany({
    where: { bookId: { in: bookIds }, ...(onlyUnprinted ? { barcodePrintedAt: null } : {}) },
    orderBy: [{ bookId: "asc" }, { barcode: "asc" }],
  });
  if (rows.length === 0) return null;

  const buffer = await generateBarcodeDocxBuffer(rows.map((r) => ({ barcode: r.barcode, location: r.location })));
  await prisma.bookCopy.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { barcodePrintedAt: new Date() },
  });
  return buffer;
}

/** Xuất file .docx in nhãn gáy cho đúng các bản sao được chọn (giữ nguyên thứ tự truyền vào), đánh dấu đã in. */
export async function exportSpineLabelsForCopies(copyIds: string[]): Promise<Buffer | null> {
  const rows = await prisma.bookCopy.findMany({
    where: { id: { in: copyIds } },
    include: { book: true },
  });
  if (rows.length === 0) return null;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = copyIds.map((id) => byId.get(id)).filter((r): r is (typeof rows)[number] => Boolean(r));

  const buffer = await generateSpineLabelDocxBuffer(
    ordered.map((r) => ({
      barcode: r.barcode,
      classificationNumber: r.book.classificationNumber,
      authorMark: r.book.authorMark,
    })),
  );
  await prisma.bookCopy.updateMany({
    where: { id: { in: ordered.map((r) => r.id) } },
    data: { spineLabelPrintedAt: new Date() },
  });
  return buffer;
}

/** Xuất file .docx in nhãn gáy cho toàn bộ bản sao thuộc các sách được chọn, tùy chọn chỉ lấy bản sao chưa in. */
export async function exportSpineLabelsBulkForBooks(bookIds: string[], onlyUnprinted: boolean): Promise<Buffer | null> {
  const rows = await prisma.bookCopy.findMany({
    where: { bookId: { in: bookIds }, ...(onlyUnprinted ? { spineLabelPrintedAt: null } : {}) },
    include: { book: true },
    orderBy: [{ bookId: "asc" }, { barcode: "asc" }],
  });
  if (rows.length === 0) return null;

  const buffer = await generateSpineLabelDocxBuffer(
    rows.map((r) => ({
      barcode: r.barcode,
      classificationNumber: r.book.classificationNumber,
      authorMark: r.book.authorMark,
    })),
  );
  await prisma.bookCopy.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { spineLabelPrintedAt: new Date() },
  });
  return buffer;
}
