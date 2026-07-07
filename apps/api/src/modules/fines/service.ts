import { prisma, type Prisma } from "@thuvien/database";
import type { FineQuery, FineWithDetails } from "@thuvien/shared";

type FineRow = Prisma.FineGetPayload<{
  include: { patron: true; loan: { include: { copy: { include: { book: true } } } } };
}>;

function toFineWithDetails(row: FineRow): FineWithDetails {
  return {
    id: row.id,
    loanId: row.loanId,
    patronId: row.patronId,
    amount: row.amount,
    reason: row.reason,
    status: row.status as FineWithDetails["status"],
    paidAt: row.paidAt?.toISOString() ?? null,
    patron: { id: row.patron.id, studentCode: row.patron.studentCode, fullName: row.patron.fullName },
    loan: {
      id: row.loan.id,
      dueDate: row.loan.dueDate.toISOString(),
      returnedAt: row.loan.returnedAt?.toISOString() ?? null,
      book: { id: row.loan.copy.book.id, title: row.loan.copy.book.title },
    },
  };
}

const fineInclude = {
  patron: true,
  loan: { include: { copy: { include: { book: true } } } },
} satisfies Prisma.FineInclude;

export async function listFines(query: FineQuery) {
  const where: Prisma.FineWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.patronId ? { patronId: query.patronId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.fine.count({ where }),
    prisma.fine.findMany({
      where,
      include: fineInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { items: rows.map(toFineWithDetails), total, page: query.page, pageSize: query.pageSize };
}

export async function listFinesForPatron(patronId: string): Promise<FineWithDetails[]> {
  const rows = await prisma.fine.findMany({
    where: { patronId },
    include: fineInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toFineWithDetails);
}

export async function getFine(id: string): Promise<FineWithDetails | null> {
  const row = await prisma.fine.findUnique({ where: { id }, include: fineInclude });
  return row ? toFineWithDetails(row) : null;
}

type FineActionResult = { ok: true; fine: FineWithDetails } | { ok: false; reason: "not_found" | "not_unpaid" };

export async function payFine(id: string): Promise<FineActionResult> {
  const existing = await prisma.fine.findUnique({ where: { id } });
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status !== "UNPAID") return { ok: false, reason: "not_unpaid" };
  const row = await prisma.fine.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
    include: fineInclude,
  });
  return { ok: true, fine: toFineWithDetails(row) };
}

export async function waiveFine(id: string): Promise<FineActionResult> {
  const existing = await prisma.fine.findUnique({ where: { id } });
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status !== "UNPAID") return { ok: false, reason: "not_unpaid" };
  const row = await prisma.fine.update({
    where: { id },
    data: { status: "WAIVED" },
    include: fineInclude,
  });
  return { ok: true, fine: toFineWithDetails(row) };
}
