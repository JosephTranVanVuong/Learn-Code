import { prisma } from "@thuvien/database";
import type { CreatePatronTypeInput, PatronType, UpdatePatronTypeInput } from "@thuvien/shared";

function toPatronType(row: {
  id: string;
  name: string;
  maxActiveLoans: number;
  loanPeriodDays: number;
  maxRenewals: number;
  isDefault: boolean;
}): PatronType {
  return {
    id: row.id,
    name: row.name,
    maxActiveLoans: row.maxActiveLoans,
    loanPeriodDays: row.loanPeriodDays,
    maxRenewals: row.maxRenewals,
    isDefault: row.isDefault,
  };
}

export async function listPatronTypes(): Promise<PatronType[]> {
  const rows = await prisma.patronType.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  return rows.map(toPatronType);
}

export async function createPatronType(input: CreatePatronTypeInput): Promise<PatronType | "duplicate"> {
  const existing = await prisma.patronType.findUnique({ where: { name: input.name } });
  if (existing) return "duplicate";
  const row = await prisma.patronType.create({ data: input });
  return toPatronType(row);
}

export async function updatePatronType(id: string, input: UpdatePatronTypeInput): Promise<PatronType | null> {
  const existing = await prisma.patronType.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.patronType.update({
    where: { id },
    data: {
      name: input.name ?? existing.name,
      maxActiveLoans: input.maxActiveLoans ?? existing.maxActiveLoans,
      loanPeriodDays: input.loanPeriodDays ?? existing.loanPeriodDays,
      maxRenewals: input.maxRenewals ?? existing.maxRenewals,
    },
  });
  return toPatronType(row);
}

export async function setDefaultPatronType(id: string): Promise<PatronType | null> {
  const existing = await prisma.patronType.findUnique({ where: { id } });
  if (!existing) return null;
  const [, row] = await prisma.$transaction([
    prisma.patronType.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
    prisma.patronType.update({ where: { id }, data: { isDefault: true } }),
  ]);
  return toPatronType(row);
}

export async function deletePatronType(id: string): Promise<"ok" | "not_found" | "is_default" | "in_use"> {
  const existing = await prisma.patronType.findUnique({ where: { id } });
  if (!existing) return "not_found";
  if (existing.isDefault) return "is_default";
  const patronCount = await prisma.patron.count({ where: { patronTypeId: id } });
  if (patronCount > 0) return "in_use";
  await prisma.patronType.delete({ where: { id } });
  return "ok";
}

/** Loại độc giả áp dụng cho một độc giả: loại đã gán, hoặc loại mặc định nếu chưa gán/không tìm thấy. */
export async function getEffectivePatronType(
  patronTypeId: string | null,
): Promise<{ maxActiveLoans: number; loanPeriodDays: number; maxRenewals: number }> {
  const row = patronTypeId ? await prisma.patronType.findUnique({ where: { id: patronTypeId } }) : null;
  if (row) return row;
  const fallback = await prisma.patronType.findFirst({ where: { isDefault: true } });
  if (fallback) return fallback;
  return { maxActiveLoans: 5, loanPeriodDays: 14, maxRenewals: 1 };
}
