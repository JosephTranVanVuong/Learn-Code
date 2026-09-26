import { randomUUID } from "node:crypto";
import { prisma } from "@thuvien/database";
import type { OldSystemPatronImportResult } from "@thuvien/shared";
import { hashPassword } from "../../lib/password";
import type { OldSystemPatronRow } from "./access-reader";

const DEFAULT_PASSWORD = "ChungSinh@123";

function oldCodeToStudentCode(oldCode: string): string {
  return "DG" + oldCode.padStart(5, "0");
}

/**
 * Nhập độc giả từ phần mềm cũ. CỘNG THÊM: bỏ qua mã độc giả đã tồn tại (suy ra từ mã cũ,
 * dạng `DG${mã cũ đệm 5 số}`) — không ghi đè thông tin độc giả đã có trong hệ thống.
 * Không có ảnh đại diện (trường "Hinh" trong Access là đối tượng OLE nhúng, không phải ảnh
 * JPEG thuần — xem HANDOFF.md). Mật khẩu mặc định giống tính năng nhập Excel độc giả có sẵn.
 */
export async function importPatronsFromOldSystem(rows: OldSystemPatronRow[]): Promise<OldSystemPatronImportResult> {
  const existing = await prisma.patron.findMany({ select: { studentCode: true } });
  const existingCodes = new Set(existing.map((p) => p.studentCode));

  const seenEmails = new Set<string>();
  const newPatrons: {
    id: string;
    studentCode: string;
    fullName: string;
    email: string | null;
    passwordHash: string;
    isActive: boolean;
  }[] = [];

  let skipped = 0;
  for (const r of rows) {
    const studentCode = oldCodeToStudentCode(r.oldCode);
    if (existingCodes.has(studentCode)) {
      skipped += 1;
      continue;
    }
    existingCodes.add(studentCode);

    let email: string | null = (r.email ?? "").trim() || null;
    if (email) {
      const key = email.toLowerCase();
      if (seenEmails.has(key)) {
        email = null;
      } else {
        seenEmails.add(key);
      }
    }

    newPatrons.push({
      id: randomUUID(),
      studentCode,
      fullName: (r.fullName ?? "").trim() || studentCode,
      email,
      passwordHash: "", // gán sau khi hash 1 lần dùng chung
      isActive: String(r.maArchive ?? "0") === "0",
    });
  }

  if (newPatrons.length > 0) {
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    for (const p of newPatrons) p.passwordHash = passwordHash;

    const BATCH = 500;
    for (let i = 0; i < newPatrons.length; i += BATCH) {
      await prisma.patron.createMany({ data: newPatrons.slice(i, i + BATCH) });
    }
  }

  return {
    totalRows: rows.length,
    patronsCreated: newPatrons.length,
    patronsSkipped: skipped,
  };
}
