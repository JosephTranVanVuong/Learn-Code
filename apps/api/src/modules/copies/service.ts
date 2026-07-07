import { prisma } from "@thuvien/database";
import type { Copy, CopyLookup, CreateCopiesInput, UpdateCopyInput } from "@thuvien/shared";
import { generateBarcode } from "../../lib/barcode";
import { getBarcodePrefix } from "../settings/service";

function toCopy(row: {
  id: string;
  bookId: string;
  barcode: string;
  status: string;
  location: string | null;
  notes: string | null;
}): Copy {
  return {
    id: row.id,
    bookId: row.bookId,
    barcode: row.barcode,
    status: row.status as Copy["status"],
    location: row.location,
    notes: row.notes,
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

  const [existingCount, prefix] = await Promise.all([
    prisma.bookCopy.count({ where: { bookId } }),
    getBarcodePrefix(),
  ]);
  await prisma.bookCopy.createMany({
    data: Array.from({ length: input.quantity }, (_, i) => ({
      bookId,
      barcode: generateBarcode(bookId, existingCount + i + 1, prefix),
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
