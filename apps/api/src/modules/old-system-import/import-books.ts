import { randomUUID } from "node:crypto";
import { prisma } from "@thuvien/database";
import type { OldSystemBookImportResult } from "@thuvien/shared";
import { slugify } from "../../lib/slugify";
import type { OldSystemBookRow } from "./access-reader";

const FALLBACK_AUTHOR = "Không rõ tác giả";
const FALLBACK_CATEGORY = "Chưa phân loại";
const BATCH = 1000;

/** Tìm thể loại phù hợp nhất theo số DDC, dựa trên các thể loại đã có ddcPrefix (khớp khoảng số gần nhất). */
function buildCategoryMatcher(categories: { id: string; ddcPrefix: string | null }[]) {
  const bounds = categories
    .filter((c): c is { id: string; ddcPrefix: string } => !!c.ddcPrefix && !Number.isNaN(parseFloat(c.ddcPrefix)))
    .map((c) => ({ id: c.id, lower: parseFloat(c.ddcPrefix) }))
    .sort((a, b) => a.lower - b.lower);

  return (ddcRaw: string | null): string | null => {
    if (!ddcRaw) return null;
    const num = parseFloat(String(ddcRaw).replace(/[^0-9.]/g, ""));
    if (Number.isNaN(num) || bounds.length === 0) return null;
    let chosen: string | null = null;
    for (const b of bounds) {
      if (b.lower <= num) chosen = b.id;
      else break;
    }
    return chosen;
  };
}

/**
 * Nhập sách + bản sao (giữ nguyên mã vạch gốc) + tác giả + thể loại từ dữ liệu phần mềm cũ.
 * CỘNG THÊM: bỏ qua mã vạch đã tồn tại; sách trùng tên (không phân biệt hoa/thường) dùng lại
 * đầu sách hiện có thay vì tạo mới, chỉ thêm các bản sao còn thiếu.
 */
export async function importBooksFromOldSystem(rows: OldSystemBookRow[]): Promise<OldSystemBookImportResult> {
  const [existingBooks, existingBarcodes, existingAuthors, existingCategories] = await Promise.all([
    prisma.book.findMany({ where: { isDeleted: false }, select: { id: true, title: true } }),
    prisma.bookCopy.findMany({ select: { barcode: true } }),
    prisma.author.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, ddcPrefix: true } }),
  ]);

  const bookIdByTitle = new Map(existingBooks.map((b) => [b.title.trim().toLowerCase(), b.id]));
  const barcodeSet = new Set(existingBarcodes.map((c) => c.barcode));
  const authorIdByName = new Map(existingAuthors.map((a) => [a.name.trim().toLowerCase(), a.id]));
  const matchCategory = buildCategoryMatcher(existingCategories);

  let fallbackCategoryId: string | null = null;
  async function getFallbackCategoryId(): Promise<string> {
    if (fallbackCategoryId) return fallbackCategoryId;
    const existing = await prisma.category.findUnique({ where: { name: FALLBACK_CATEGORY } });
    if (existing) {
      fallbackCategoryId = existing.id;
      return existing.id;
    }
    const baseSlug = slugify(FALLBACK_CATEGORY) || "chua-phan-loai";
    let slug = baseSlug;
    let attempt = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }
    const created = await prisma.category.create({ data: { name: FALLBACK_CATEGORY, slug, ddcPrefix: null } });
    categoriesCreated += 1;
    fallbackCategoryId = created.id;
    return created.id;
  }

  let categoriesCreated = 0;
  let authorsCreated = 0;

  const newAuthorRows: { id: string; name: string }[] = [];
  function getAuthorId(nameRaw: string | null): string {
    const name = (nameRaw || "").trim() || FALLBACK_AUTHOR;
    const key = name.toLowerCase();
    const existing = authorIdByName.get(key);
    if (existing) return existing;
    const id = randomUUID();
    authorIdByName.set(key, id);
    newAuthorRows.push({ id, name });
    authorsCreated += 1;
    return id;
  }

  // Chỉ xử lý các dòng có mã vạch CHƯA tồn tại — mã đã có coi như đã nhập từ trước.
  const newRows = rows.filter((r) => r.barcode && !barcodeSet.has(r.barcode));
  const copiesSkipped = rows.length - newRows.length;

  const groups = new Map<string, OldSystemBookRow[]>();
  for (const r of newRows) {
    const key = r.title.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const newBooks: {
    id: string;
    title: string;
    authorId: string;
    publisher?: string;
    publishedYear?: number;
    isbn?: string;
    language: string;
    description?: string;
    categoryId: string;
    classificationNumber?: string;
    authorMark?: string;
  }[] = [];
  const newCopies: { id: string; bookId: string; barcode: string }[] = [];
  const usedIsbn = new Set<string>();
  let booksCreated = 0;

  for (const [key, groupRows] of groups) {
    let bookId = bookIdByTitle.get(key);
    if (!bookId) {
      const first = groupRows[0]!;
      bookId = randomUUID();
      bookIdByTitle.set(key, bookId);

      const categoryId = matchCategory(first.ddc) ?? (await getFallbackCategoryId());
      let publishedYear: number | undefined;
      const yr = parseInt(String(first.publishedYear ?? "").replace(/[^0-9]/g, ""), 10);
      if (!Number.isNaN(yr) && yr > 0) publishedYear = yr;

      let isbn: string | undefined;
      const rawIsbn = (first.isbn ?? "").trim();
      if (rawIsbn && !usedIsbn.has(rawIsbn)) {
        isbn = rawIsbn;
        usedIsbn.add(rawIsbn);
      }

      newBooks.push({
        id: bookId,
        title: first.title.trim(),
        authorId: getAuthorId(first.author),
        publisher: (first.publisher ?? "").trim() || undefined,
        publishedYear,
        isbn,
        language: (first.language ?? "").trim() || "Tiếng Việt",
        description: (first.description ?? "").trim() || undefined,
        categoryId,
        classificationNumber: (first.ddc ?? "").trim() || undefined,
        authorMark: (first.authorMark ?? "").trim() || undefined,
      });
      booksCreated += 1;
    }

    for (const r of groupRows) {
      newCopies.push({ id: randomUUID(), bookId, barcode: r.barcode });
    }
  }

  for (let i = 0; i < newAuthorRows.length; i += BATCH) {
    await prisma.author.createMany({ data: newAuthorRows.slice(i, i + BATCH) });
  }
  for (let i = 0; i < newBooks.length; i += BATCH) {
    await prisma.book.createMany({ data: newBooks.slice(i, i + BATCH) });
  }
  for (let i = 0; i < newCopies.length; i += BATCH) {
    await prisma.bookCopy.createMany({
      data: newCopies.slice(i, i + BATCH).map((c) => ({ id: c.id, bookId: c.bookId, barcode: c.barcode })),
    });
  }

  return {
    totalRows: rows.length,
    booksCreated,
    copiesCreated: newCopies.length,
    copiesSkipped,
    authorsCreated,
    categoriesCreated,
  };
}
