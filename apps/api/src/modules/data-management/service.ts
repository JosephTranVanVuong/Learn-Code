import { prisma } from "@thuvien/database";
import type {
  DataDeletionLogEntry,
  DeleteAllDataResult,
  DeleteBooksDataResult,
  DeleteCategoriesAuthorsResult,
  DeleteDataCounts,
  DeleteLoansFinesResult,
  DeletePatronsDataResult,
} from "@thuvien/shared";
import { createSafetyBackup } from "../../lib/db-file";
import { deleteAvatarImageFile, deleteCoverImageFile } from "../../lib/uploads";

export interface DeletionActor {
  id: string;
  name: string;
}

async function logDeletion(actor: DeletionActor, action: string, summary: string): Promise<void> {
  await prisma.dataDeletionLog.create({
    data: { actorId: actor.id, actorName: actor.name, action, summary },
  });
}

export async function getDeletionCounts(): Promise<DeleteDataCounts> {
  const [loans, fines, patrons, books, bookCopies, categories, authors] = await Promise.all([
    prisma.loan.count(),
    prisma.fine.count(),
    prisma.patron.count(),
    prisma.book.count(),
    prisma.bookCopy.count(),
    prisma.category.count(),
    prisma.author.count(),
  ]);
  return { loans, fines, patrons, books, bookCopies, categories, authors };
}

export async function listDeletionLogs(): Promise<DataDeletionLogEntry[]> {
  const rows = await prisma.dataDeletionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actorName,
    action: r.action,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function deleteLoansAndFines(actor: DeletionActor): Promise<DeleteLoansFinesResult> {
  await createSafetyBackup("pre-delete-loans-fines");

  const [fines, loans] = await prisma.$transaction([
    prisma.fine.deleteMany({}),
    prisma.loan.deleteMany({}),
  ]);
  await prisma.bookCopy.updateMany({ where: { status: "BORROWED" }, data: { status: "AVAILABLE" } });

  const result = { deletedLoans: loans.count, deletedFines: fines.count };
  await logDeletion(actor, "loans_fines", `${result.deletedLoans} lượt mượn, ${result.deletedFines} phiếu phạt`);
  return result;
}

export async function deletePatronsData(actor: DeletionActor): Promise<DeletePatronsDataResult> {
  await createSafetyBackup("pre-delete-patrons");

  const patronsWithAvatar = await prisma.patron.findMany({
    where: { avatarUrl: { not: null } },
    select: { avatarUrl: true },
  });

  const [, , , patrons] = await prisma.$transaction([
    prisma.fine.deleteMany({}),
    prisma.loan.deleteMany({}),
    prisma.refreshToken.deleteMany({ where: { patronId: { not: null } } }),
    prisma.patron.deleteMany({}),
  ]);
  await prisma.bookCopy.updateMany({ where: { status: "BORROWED" }, data: { status: "AVAILABLE" } });

  for (const p of patronsWithAvatar) {
    await deleteAvatarImageFile(p.avatarUrl);
  }

  const result = { deletedPatrons: patrons.count };
  await logDeletion(actor, "patrons", `${result.deletedPatrons} độc giả`);
  return result;
}

export async function deleteBooksData(actor: DeletionActor): Promise<DeleteBooksDataResult> {
  await createSafetyBackup("pre-delete-books");

  const booksWithCover = await prisma.book.findMany({
    where: { coverImageUrl: { not: null } },
    select: { coverImageUrl: true },
  });

  const [, , , books] = await prisma.$transaction([
    prisma.fine.deleteMany({}),
    prisma.loan.deleteMany({}),
    prisma.bookCopy.deleteMany({}),
    prisma.book.deleteMany({}),
  ]);

  for (const b of booksWithCover) {
    await deleteCoverImageFile(b.coverImageUrl);
  }

  const result = { deletedBooks: books.count };
  await logDeletion(actor, "books", `${result.deletedBooks} sách`);
  return result;
}

export async function deleteCategoriesAndAuthors(
  actor: DeletionActor,
): Promise<{ status: "ok"; result: DeleteCategoriesAuthorsResult } | { status: "has_books" }> {
  const bookCount = await prisma.book.count();
  if (bookCount > 0) return { status: "has_books" };

  await createSafetyBackup("pre-delete-categories-authors");
  const [categories, authors] = await prisma.$transaction([
    prisma.category.deleteMany({}),
    prisma.author.deleteMany({}),
  ]);

  const result = { deletedCategories: categories.count, deletedAuthors: authors.count };
  await logDeletion(actor, "categories_authors", `${result.deletedCategories} thể loại, ${result.deletedAuthors} tác giả`);
  return { status: "ok", result };
}

export async function deleteAllData(actor: DeletionActor): Promise<DeleteAllDataResult> {
  await createSafetyBackup("pre-delete-all");

  const patronsWithAvatar = await prisma.patron.findMany({
    where: { avatarUrl: { not: null } },
    select: { avatarUrl: true },
  });
  const booksWithCover = await prisma.book.findMany({
    where: { coverImageUrl: { not: null } },
    select: { coverImageUrl: true },
  });

  const [fines, loans, , patrons, , books, categories, authors] = await prisma.$transaction([
    prisma.fine.deleteMany({}),
    prisma.loan.deleteMany({}),
    prisma.refreshToken.deleteMany({ where: { patronId: { not: null } } }),
    prisma.patron.deleteMany({}),
    prisma.bookCopy.deleteMany({}),
    prisma.book.deleteMany({}),
    prisma.category.deleteMany({}),
    prisma.author.deleteMany({}),
  ]);

  for (const p of patronsWithAvatar) {
    await deleteAvatarImageFile(p.avatarUrl);
  }
  for (const b of booksWithCover) {
    await deleteCoverImageFile(b.coverImageUrl);
  }

  const result = {
    deletedLoans: loans.count,
    deletedFines: fines.count,
    deletedPatrons: patrons.count,
    deletedBooks: books.count,
    deletedCategories: categories.count,
    deletedAuthors: authors.count,
  };
  await logDeletion(
    actor,
    "all",
    `${result.deletedLoans} lượt mượn, ${result.deletedFines} phiếu phạt, ${result.deletedPatrons} độc giả, ${result.deletedBooks} sách, ${result.deletedCategories} thể loại, ${result.deletedAuthors} tác giả`,
  );
  return result;
}
