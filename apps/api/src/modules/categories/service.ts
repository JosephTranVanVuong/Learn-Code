import { prisma } from "@thuvien/database";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@thuvien/shared";
import { slugify } from "../../lib/slugify";

function toCategory(row: {
  id: string;
  name: string;
  slug: string;
  ddcPrefix: string | null;
  _count?: { books: number };
}): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ddcPrefix: row.ddcPrefix,
    bookCount: row._count?.books,
  };
}

export async function listCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    include: { _count: { select: { books: { where: { isDeleted: false } } } } },
    orderBy: { name: "asc" },
  });
  return rows.map(toCategory);
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const baseSlug = slugify(input.name) || "the-loai";
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
  const row = await prisma.category.create({
    data: { name: input.name, slug, ddcPrefix: input.ddcPrefix || null },
  });
  return toCategory(row);
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category | null> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.category.update({
    where: { id },
    data: {
      name: input.name ?? existing.name,
      ddcPrefix: input.ddcPrefix !== undefined ? input.ddcPrefix || null : existing.ddcPrefix,
    },
  });
  return toCategory(row);
}

export async function deleteCategory(id: string): Promise<"ok" | "not_found" | "has_books"> {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  });
  if (!existing) return "not_found";
  if (existing._count.books > 0) return "has_books";
  await prisma.category.delete({ where: { id } });
  return "ok";
}
