import { prisma } from "@thuvien/database";
import type { Author, CreateAuthorInput, UpdateAuthorInput } from "@thuvien/shared";

function toAuthor(row: { id: string; name: string; _count?: { books: number } }): Author {
  return {
    id: row.id,
    name: row.name,
    bookCount: row._count?.books,
  };
}

export async function listAuthors(): Promise<Author[]> {
  const rows = await prisma.author.findMany({
    include: { _count: { select: { books: { where: { isDeleted: false } } } } },
    orderBy: { name: "asc" },
  });
  return rows.map(toAuthor);
}

export async function createAuthor(input: CreateAuthorInput): Promise<Author> {
  const row = await prisma.author.create({ data: { name: input.name } });
  return toAuthor(row);
}

export async function updateAuthor(id: string, input: UpdateAuthorInput): Promise<Author | null> {
  const existing = await prisma.author.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.author.update({
    where: { id },
    data: { name: input.name ?? existing.name },
  });
  return toAuthor(row);
}

export async function deleteAuthor(id: string): Promise<"ok" | "not_found" | "has_books"> {
  const existing = await prisma.author.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  });
  if (!existing) return "not_found";
  if (existing._count.books > 0) return "has_books";
  await prisma.author.delete({ where: { id } });
  return "ok";
}
