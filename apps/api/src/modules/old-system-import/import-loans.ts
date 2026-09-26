import { randomUUID } from "node:crypto";
import { prisma } from "@thuvien/database";
import type { OldSystemLoanImportResult } from "@thuvien/shared";
import type { OldSystemLoanRow } from "./access-reader";

function oldCodeToStudentCode(oldCode: string): string {
  return "DG" + oldCode.padStart(5, "0");
}

/**
 * Nhập lịch sử mượn/trả từ phần mềm cũ. CỘNG THÊM: bỏ qua các phiếu đã tồn tại
 * (khớp theo độc giả + bản sao + ngày mượn — dữ liệu cũ không có khóa ổn định nào khác để đối chiếu).
 * Bản sao đang có phiếu mượn còn hoạt động (chưa trả) sẽ tự chuyển trạng thái "Đang mượn".
 */
export async function importLoansFromOldSystem(rows: OldSystemLoanRow[]): Promise<OldSystemLoanImportResult> {
  const [patrons, copies, existingLoans] = await Promise.all([
    prisma.patron.findMany({ select: { id: true, studentCode: true } }),
    prisma.bookCopy.findMany({ select: { id: true, barcode: true } }),
    prisma.loan.findMany({ select: { patronId: true, copyId: true, borrowedAt: true } }),
  ]);

  const patronIdByCode = new Map(patrons.map((p) => [p.studentCode, p.id]));
  const copyIdByBarcode = new Map(copies.map((c) => [c.barcode, c.id]));
  const existingKeys = new Set(existingLoans.map((l) => `${l.patronId}|${l.copyId}|${l.borrowedAt.toISOString()}`));

  const newLoans: {
    id: string;
    copyId: string;
    patronId: string;
    borrowedAt: Date;
    dueDate: Date;
    returnedAt: Date | null;
    status: string;
    renewedCount: number;
  }[] = [];
  const activeCopyIds = new Set<string>();

  let skippedOrphanPatron = 0;
  let skippedOrphanCopy = 0;
  let skippedMissingDate = 0;
  let loansSkipped = 0;

  for (const r of rows) {
    const patronId = patronIdByCode.get(oldCodeToStudentCode(r.oldPatronCode));
    if (!patronId) {
      skippedOrphanPatron += 1;
      continue;
    }
    const copyId = copyIdByBarcode.get(r.barcode);
    if (!copyId) {
      skippedOrphanCopy += 1;
      continue;
    }
    if (!r.borrowedAt || !r.dueDate) {
      skippedMissingDate += 1;
      continue;
    }

    const borrowedAt = new Date(r.borrowedAt);
    const key = `${patronId}|${copyId}|${borrowedAt.toISOString()}`;
    if (existingKeys.has(key)) {
      loansSkipped += 1;
      continue;
    }
    existingKeys.add(key);

    const returnedAt = r.returnedAt ? new Date(r.returnedAt) : null;
    const status = returnedAt ? "RETURNED" : "ACTIVE";
    if (!returnedAt) activeCopyIds.add(copyId);

    newLoans.push({
      id: randomUUID(),
      copyId,
      patronId,
      borrowedAt,
      dueDate: new Date(r.dueDate),
      returnedAt,
      status,
      renewedCount: 0,
    });
  }

  const BATCH = 1000;
  for (let i = 0; i < newLoans.length; i += BATCH) {
    await prisma.loan.createMany({ data: newLoans.slice(i, i + BATCH) });
  }

  const activeIds = [...activeCopyIds];
  for (let i = 0; i < activeIds.length; i += 500) {
    await prisma.bookCopy.updateMany({
      where: { id: { in: activeIds.slice(i, i + 500) } },
      data: { status: "BORROWED" },
    });
  }

  return {
    totalRows: rows.length,
    loansCreated: newLoans.length,
    loansSkipped,
    skippedOrphanPatron,
    skippedOrphanCopy,
    skippedMissingDate,
  };
}
