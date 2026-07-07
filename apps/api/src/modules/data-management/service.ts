import { prisma } from "@thuvien/database";
import type { DeleteBooksDataResult, DeleteLoansFinesResult, DeletePatronsDataResult } from "@thuvien/shared";
import { createSafetyBackup } from "../../lib/db-file";
import { deleteAvatarImageFile, deleteCoverImageFile } from "../../lib/uploads";

export async function deleteLoansAndFines(): Promise<DeleteLoansFinesResult> {
  await createSafetyBackup("pre-delete-loans-fines");

  const [fines, loans] = await prisma.$transaction([
    prisma.fine.deleteMany({}),
    prisma.loan.deleteMany({}),
  ]);
  await prisma.bookCopy.updateMany({ where: { status: "BORROWED" }, data: { status: "AVAILABLE" } });

  return { deletedLoans: loans.count, deletedFines: fines.count };
}

export async function deletePatronsData(): Promise<DeletePatronsDataResult> {
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

  return { deletedPatrons: patrons.count };
}

export async function deleteBooksData(): Promise<DeleteBooksDataResult> {
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

  return { deletedBooks: books.count };
}

export async function deleteCategoriesAndAuthors(): Promise<"ok" | "has_books"> {
  const bookCount = await prisma.book.count();
  if (bookCount > 0) return "has_books";

  await createSafetyBackup("pre-delete-categories-authors");
  await prisma.$transaction([prisma.category.deleteMany({}), prisma.author.deleteMany({})]);
  return "ok";
}

export async function deleteAllData(): Promise<void> {
  await createSafetyBackup("pre-delete-all");

  const patronsWithAvatar = await prisma.patron.findMany({
    where: { avatarUrl: { not: null } },
    select: { avatarUrl: true },
  });
  const booksWithCover = await prisma.book.findMany({
    where: { coverImageUrl: { not: null } },
    select: { coverImageUrl: true },
  });

  await prisma.$transaction([
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
}
