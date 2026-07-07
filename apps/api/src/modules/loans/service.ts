import { prisma, type Prisma } from "@thuvien/database";
import type { CreateLoanInput, CreateLoansBatchInput, FineStatus, LoanQuery, LoanWithDetails } from "@thuvien/shared";
import { getEffectivePatronType } from "../patron-types/service";
import { getFineSettings } from "../settings/service";

type LoanRow = Prisma.LoanGetPayload<{
  include: { copy: { include: { book: { include: { author: true } } } }; patron: true; fine: true };
}>;

function toLoanWithDetails(row: LoanRow): LoanWithDetails {
  const isOverdue = row.status === "ACTIVE" && row.dueDate.getTime() < Date.now();
  return {
    id: row.id,
    copyId: row.copyId,
    patronId: row.patronId,
    borrowedAt: row.borrowedAt.toISOString(),
    dueDate: row.dueDate.toISOString(),
    returnedAt: row.returnedAt?.toISOString() ?? null,
    status: isOverdue ? "OVERDUE" : (row.status as LoanWithDetails["status"]),
    renewedCount: row.renewedCount,
    copy: { id: row.copy.id, barcode: row.copy.barcode, bookId: row.copy.bookId },
    book: { id: row.copy.book.id, title: row.copy.book.title, author: row.copy.book.author.name },
    patron: { id: row.patron.id, studentCode: row.patron.studentCode, fullName: row.patron.fullName },
    fine: row.fine
      ? {
          id: row.fine.id,
          loanId: row.fine.loanId,
          patronId: row.fine.patronId,
          amount: row.fine.amount,
          reason: row.fine.reason,
          status: row.fine.status as FineStatus,
          paidAt: row.fine.paidAt?.toISOString() ?? null,
        }
      : null,
  };
}

const loanInclude = {
  copy: { include: { book: { include: { author: true } } } },
  patron: true,
  fine: true,
} satisfies Prisma.LoanInclude;

export async function listLoans(query: LoanQuery) {
  const where: Prisma.LoanWhereInput = {
    ...(query.patronId ? { patronId: query.patronId } : {}),
    ...(query.status === "OVERDUE"
      ? { status: "ACTIVE", dueDate: { lt: new Date() } }
      : query.status === "ACTIVE"
        ? { status: "ACTIVE" }
        : query.status === "RETURNED"
          ? { status: "RETURNED" }
          : {}),
    ...(query.search
      ? {
          OR: [
            { patron: { fullName: { contains: query.search } } },
            { patron: { studentCode: { contains: query.search } } },
            { copy: { barcode: { contains: query.search } } },
            { copy: { book: { title: { contains: query.search } } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.loan.count({ where }),
    prisma.loan.findMany({
      where,
      include: loanInclude,
      orderBy: { borrowedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { items: rows.map(toLoanWithDetails), total, page: query.page, pageSize: query.pageSize };
}

export async function listOverdueLoans(): Promise<LoanWithDetails[]> {
  const rows = await prisma.loan.findMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    include: loanInclude,
    orderBy: { dueDate: "asc" },
  });
  return rows.map(toLoanWithDetails);
}

export async function listLoansForPatron(patronId: string): Promise<LoanWithDetails[]> {
  const rows = await prisma.loan.findMany({
    where: { patronId },
    include: loanInclude,
    orderBy: { borrowedAt: "desc" },
  });
  return rows.map(toLoanWithDetails);
}

export async function getLoan(id: string): Promise<LoanWithDetails | null> {
  const row = await prisma.loan.findUnique({ where: { id }, include: loanInclude });
  return row ? toLoanWithDetails(row) : null;
}

type CreateLoanResult =
  | { ok: true; loan: LoanWithDetails }
  | {
      ok: false;
      reason: "copy_not_found" | "copy_not_available" | "patron_not_found" | "patron_inactive" | "loan_limit_reached";
    };

export async function createLoan(input: CreateLoanInput): Promise<CreateLoanResult> {
  const copy = await prisma.bookCopy.findUnique({ where: { id: input.copyId } });
  if (!copy) return { ok: false, reason: "copy_not_found" };
  if (copy.status !== "AVAILABLE") return { ok: false, reason: "copy_not_available" };

  const patron = await prisma.patron.findUnique({ where: { id: input.patronId } });
  if (!patron) return { ok: false, reason: "patron_not_found" };
  if (!patron.isActive) return { ok: false, reason: "patron_inactive" };

  const policy = await getEffectivePatronType(patron.patronTypeId);
  const activeLoanCount = await prisma.loan.count({ where: { patronId: patron.id, status: "ACTIVE" } });
  if (activeLoanCount >= policy.maxActiveLoans) {
    return { ok: false, reason: "loan_limit_reached" };
  }

  const dueDate = new Date(Date.now() + policy.loanPeriodDays * 24 * 60 * 60 * 1000);

  const row = await prisma.$transaction(async (tx) => {
    await tx.bookCopy.update({ where: { id: copy.id }, data: { status: "BORROWED" } });
    const created = await tx.loan.create({
      data: { copyId: copy.id, patronId: patron.id, dueDate },
    });
    return tx.loan.findUniqueOrThrow({ where: { id: created.id }, include: loanInclude });
  });

  return { ok: true, loan: toLoanWithDetails(row) };
}

type CreateLoansBatchResult =
  | { ok: true; loans: LoanWithDetails[] }
  | { ok: false; reason: "patron_not_found" | "patron_inactive" }
  | { ok: false; reason: "loan_limit_exceeded"; maxActiveLoans: number; currentActiveLoans: number }
  | { ok: false; reason: "copies_unavailable"; unavailableCopyIds: string[] };

export async function createLoansBatch(input: CreateLoansBatchInput): Promise<CreateLoansBatchResult> {
  const patron = await prisma.patron.findUnique({ where: { id: input.patronId } });
  if (!patron) return { ok: false, reason: "patron_not_found" };
  if (!patron.isActive) return { ok: false, reason: "patron_inactive" };

  const uniqueCopyIds = Array.from(new Set(input.copyIds));
  const copies = await prisma.bookCopy.findMany({ where: { id: { in: uniqueCopyIds } } });
  const copyById = new Map(copies.map((c) => [c.id, c]));
  const unavailableCopyIds = uniqueCopyIds.filter((id) => copyById.get(id)?.status !== "AVAILABLE");
  if (unavailableCopyIds.length > 0) {
    return { ok: false, reason: "copies_unavailable", unavailableCopyIds };
  }

  const policy = await getEffectivePatronType(patron.patronTypeId);
  const activeLoanCount = await prisma.loan.count({ where: { patronId: patron.id, status: "ACTIVE" } });
  if (activeLoanCount + uniqueCopyIds.length > policy.maxActiveLoans) {
    return {
      ok: false,
      reason: "loan_limit_exceeded",
      maxActiveLoans: policy.maxActiveLoans,
      currentActiveLoans: activeLoanCount,
    };
  }

  const dueDate = new Date(Date.now() + policy.loanPeriodDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.$transaction(async (tx) => {
    const createdIds: string[] = [];
    for (const copyId of uniqueCopyIds) {
      await tx.bookCopy.update({ where: { id: copyId }, data: { status: "BORROWED" } });
      const created = await tx.loan.create({ data: { copyId, patronId: patron.id, dueDate } });
      createdIds.push(created.id);
    }
    return tx.loan.findMany({ where: { id: { in: createdIds } }, include: loanInclude });
  });

  return { ok: true, loans: rows.map(toLoanWithDetails) };
}

type ReturnLoanResult =
  | { ok: true; loan: LoanWithDetails }
  | { ok: false; reason: "not_found" | "already_returned" };

export async function returnLoan(id: string): Promise<ReturnLoanResult> {
  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) return { ok: false, reason: "not_found" };
  if (loan.status === "RETURNED") return { ok: false, reason: "already_returned" };

  const now = new Date();
  const daysLate = Math.max(0, Math.ceil((now.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000)));
  const { finePerDayVnd } = await getFineSettings();

  const row = await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id },
      data: { returnedAt: now, status: "RETURNED" },
    });
    await tx.bookCopy.update({ where: { id: loan.copyId }, data: { status: "AVAILABLE" } });

    if (daysLate > 0) {
      await tx.fine.create({
        data: {
          loanId: id,
          patronId: loan.patronId,
          amount: daysLate * finePerDayVnd,
          reason: `Trả sách trễ hạn ${daysLate} ngày`,
        },
      });
    }

    return tx.loan.findUniqueOrThrow({ where: { id }, include: loanInclude });
  });

  return { ok: true, loan: toLoanWithDetails(row) };
}

type ReturnByBarcodeResult =
  | { ok: true; loan: LoanWithDetails }
  | { ok: false; reason: "copy_not_found" | "no_active_loan" };

export async function returnLoanByBarcode(barcode: string): Promise<ReturnByBarcodeResult> {
  const copy = await prisma.bookCopy.findUnique({ where: { barcode } });
  if (!copy) return { ok: false, reason: "copy_not_found" };

  const loan = await prisma.loan.findFirst({ where: { copyId: copy.id, status: "ACTIVE" } });
  if (!loan) return { ok: false, reason: "no_active_loan" };

  const result = await returnLoan(loan.id);
  if (!result.ok) {
    return { ok: false, reason: "no_active_loan" };
  }
  return result;
}

type RenewLoanResult =
  | { ok: true; loan: LoanWithDetails }
  | {
      ok: false;
      reason: "not_found" | "already_returned" | "overdue" | "renew_limit_reached" | "invalid_date";
    };

export async function renewLoan(id: string, newDueDate: Date): Promise<RenewLoanResult> {
  const loan = await prisma.loan.findUnique({ where: { id }, include: { patron: true } });
  if (!loan) return { ok: false, reason: "not_found" };
  if (loan.status === "RETURNED") return { ok: false, reason: "already_returned" };
  if (loan.dueDate.getTime() < Date.now()) return { ok: false, reason: "overdue" };
  const policy = await getEffectivePatronType(loan.patron.patronTypeId);
  if (loan.renewedCount >= policy.maxRenewals) return { ok: false, reason: "renew_limit_reached" };
  if (Number.isNaN(newDueDate.getTime()) || newDueDate.getTime() <= loan.dueDate.getTime()) {
    return { ok: false, reason: "invalid_date" };
  }

  const row = await prisma.loan.update({
    where: { id },
    data: { dueDate: newDueDate, renewedCount: { increment: 1 } },
    include: loanInclude,
  });

  return { ok: true, loan: toLoanWithDetails(row) };
}
