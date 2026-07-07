import { prisma, type Prisma } from "@thuvien/database";
import type {
  CreatePatronInput,
  Patron,
  PatronQuery,
  ResetPatronPasswordInput,
  UpdatePatronInput,
} from "@thuvien/shared";
import { hashPassword } from "../../lib/password";

const patronInclude = { patronType: { select: { name: true } } } satisfies Prisma.PatronInclude;

type PatronRow = Prisma.PatronGetPayload<{ include: typeof patronInclude }>;

function toPatron(row: PatronRow): Patron {
  return {
    id: row.id,
    studentCode: row.studentCode,
    fullName: row.fullName,
    className: row.className,
    phone: row.phone,
    email: row.email,
    avatarUrl: row.avatarUrl,
    isActive: row.isActive,
    patronTypeId: row.patronTypeId,
    patronTypeName: row.patronType?.name ?? null,
  };
}

export async function listPatrons(query: PatronQuery) {
  const where = query.search
    ? {
        OR: [
          { fullName: { contains: query.search } },
          { studentCode: { contains: query.search } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.patron.count({ where }),
    prisma.patron.findMany({
      where,
      include: patronInclude,
      orderBy: { fullName: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { items: rows.map(toPatron), total, page: query.page, pageSize: query.pageSize };
}

export async function getPatron(id: string): Promise<Patron | null> {
  const row = await prisma.patron.findUnique({ where: { id }, include: patronInclude });
  return row ? toPatron(row) : null;
}

export async function getPatronByStudentCode(studentCode: string): Promise<Patron | null> {
  const row = await prisma.patron.findUnique({ where: { studentCode }, include: patronInclude });
  return row ? toPatron(row) : null;
}

export async function createPatron(input: CreatePatronInput): Promise<Patron | "duplicate"> {
  const existing = await prisma.patron.findUnique({ where: { studentCode: input.studentCode } });
  if (existing) return "duplicate";

  const passwordHash = await hashPassword(input.password);
  const patronTypeId = input.patronTypeId ?? (await prisma.patronType.findFirst({ where: { isDefault: true } }))?.id;
  const row = await prisma.patron.create({
    data: {
      studentCode: input.studentCode,
      fullName: input.fullName,
      className: input.className,
      phone: input.phone,
      email: input.email || null,
      passwordHash,
      patronTypeId,
    },
    include: patronInclude,
  });
  return toPatron(row);
}

export async function updatePatron(id: string, input: UpdatePatronInput): Promise<Patron | null> {
  const existing = await prisma.patron.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.patron.update({
    where: { id },
    data: {
      fullName: input.fullName ?? existing.fullName,
      className: input.className ?? existing.className,
      phone: input.phone ?? existing.phone,
      email: input.email !== undefined ? input.email || null : existing.email,
      isActive: input.isActive ?? existing.isActive,
      patronTypeId: input.patronTypeId ?? existing.patronTypeId,
    },
    include: patronInclude,
  });
  return toPatron(row);
}

export async function updatePatronAvatar(id: string, avatarUrl: string | null): Promise<Patron | null> {
  const existing = await prisma.patron.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.patron.update({ where: { id }, data: { avatarUrl }, include: patronInclude });
  return toPatron(row);
}

export async function resetPatronPassword(
  id: string,
  input: ResetPatronPasswordInput,
): Promise<boolean> {
  const existing = await prisma.patron.findUnique({ where: { id } });
  if (!existing) return false;
  const passwordHash = await hashPassword(input.password);
  await prisma.patron.update({ where: { id }, data: { passwordHash } });
  return true;
}

export async function deactivatePatron(id: string): Promise<"ok" | "not_found" | "has_active_loans"> {
  const existing = await prisma.patron.findUnique({ where: { id } });
  if (!existing) return "not_found";
  const activeLoans = await prisma.loan.count({ where: { patronId: id, status: "ACTIVE" } });
  if (activeLoans > 0) return "has_active_loans";
  await prisma.patron.update({ where: { id }, data: { isActive: false } });
  return "ok";
}

/** Xóa vĩnh viễn hồ sơ độc giả — chỉ cho phép khi chưa từng mượn sách/bị phạt (không có lịch sử). */
export async function deletePatronPermanently(id: string): Promise<"ok" | "not_found" | "has_history"> {
  const existing = await prisma.patron.findUnique({
    where: { id },
    include: { _count: { select: { loans: true, fines: true } } },
  });
  if (!existing) return "not_found";
  if (existing._count.loans > 0 || existing._count.fines > 0) return "has_history";

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { patronId: id } }),
    prisma.patron.delete({ where: { id } }),
  ]);
  return "ok";
}
