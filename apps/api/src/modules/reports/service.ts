import { prisma } from "@thuvien/database";
import type {
  LoansByPeriodPoint,
  MostBorrowedBook,
  OverdueSummaryItem,
  PatronActivityItem,
  ReportsOverview,
} from "@thuvien/shared";
import { getFineSettings } from "../settings/service";

export async function getOverview(): Promise<ReportsOverview> {
  const now = new Date();
  const [totalBooks, totalCopies, totalPatrons, activeLoans, overdueLoans, unpaidFines] =
    await Promise.all([
      prisma.book.count({ where: { isDeleted: false } }),
      prisma.bookCopy.count(),
      prisma.patron.count({ where: { isActive: true } }),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "ACTIVE", dueDate: { lt: now } } }),
      prisma.fine.aggregate({ where: { status: "UNPAID" }, _sum: { amount: true }, _count: true }),
    ]);

  return {
    totalBooks,
    totalCopies,
    totalPatrons,
    activeLoans,
    overdueLoans,
    unpaidFinesCount: unpaidFines._count,
    unpaidFinesTotal: unpaidFines._sum.amount ?? 0,
  };
}

export async function getMostBorrowedBooks(limit: number): Promise<MostBorrowedBook[]> {
  const loans = await prisma.loan.findMany({
    include: { copy: { include: { book: { include: { category: true, author: true } } } } },
  });

  const counts = new Map<string, MostBorrowedBook>();
  for (const loan of loans) {
    const book = loan.copy.book;
    const existing = counts.get(book.id);
    if (existing) {
      existing.borrowCount += 1;
    } else {
      counts.set(book.id, {
        id: book.id,
        title: book.title,
        author: book.author.name,
        categoryName: book.category.name,
        borrowCount: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, limit);
}

export async function getOverdueSummary(): Promise<OverdueSummaryItem[]> {
  const now = new Date();
  const [loans, { finePerDayVnd }] = await Promise.all([
    prisma.loan.findMany({
      where: { status: "ACTIVE", dueDate: { lt: now } },
      include: { copy: { include: { book: true } }, patron: true },
      orderBy: { dueDate: "asc" },
    }),
    getFineSettings(),
  ]);

  return loans.map((loan) => {
    const daysOverdue = Math.max(
      1,
      Math.ceil((now.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000)),
    );
    return {
      loanId: loan.id,
      bookTitle: loan.copy.book.title,
      patronName: loan.patron.fullName,
      studentCode: loan.patron.studentCode,
      dueDate: loan.dueDate.toISOString(),
      daysOverdue,
      estimatedFine: daysOverdue * finePerDayVnd,
    };
  });
}

export async function getLoansByPeriod(days: number): Promise<LoansByPeriodPoint[]> {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const since = new Date(todayUtc - (days - 1) * 24 * 60 * 60 * 1000);

  const loans = await prisma.loan.findMany({
    where: { borrowedAt: { gte: since } },
    select: { borrowedAt: true },
  });

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const loan of loans) {
    const key = loan.borrowedAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export async function getPatronActivity(limit: number): Promise<PatronActivityItem[]> {
  const loans = await prisma.loan.findMany({ include: { patron: true } });

  const counts = new Map<string, PatronActivityItem>();
  for (const loan of loans) {
    const existing = counts.get(loan.patronId);
    if (existing) {
      existing.loanCount += 1;
    } else {
      counts.set(loan.patronId, {
        patronId: loan.patronId,
        studentCode: loan.patron.studentCode,
        fullName: loan.patron.fullName,
        loanCount: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.loanCount - a.loanCount)
    .slice(0, limit);
}
