import * as XLSX from "xlsx";
import { prisma } from "@thuvien/database";
import type { PatronImportResult } from "@thuvien/shared";
import { hashPassword } from "../../lib/password";

const TEMPLATE_HEADERS = ["Mã số độc giả", "Họ tên", "Khóa / Lớp", "Số điện thoại", "Email", "Mật khẩu"];

const DEFAULT_PASSWORD = "ChungSinh@123";

export function generatePatronImportTemplate(): Buffer {
  const sample = [TEMPLATE_HEADERS, ["CS105", "Nguyễn Văn Mẫu", "Khóa XIV", "", "", ""]];
  const worksheet = XLSX.utils.aoa_to_sheet(sample);
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 26 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DocGia");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function readCell(row: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return undefined;
}

export async function importPatronsFromExcel(buffer: Buffer): Promise<PatronImportResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  const rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : [];

  const errors: PatronImportResult["errors"] = [];
  const duplicates: PatronImportResult["duplicates"] = [];
  let successCount = 0;

  const existingPatrons = await prisma.patron.findMany({ select: { studentCode: true, email: true } });
  const existingCodes = new Set(existingPatrons.map((p) => p.studentCode.toLowerCase()));
  const existingEmails = new Set(existingPatrons.filter((p) => p.email).map((p) => p.email!.toLowerCase()));

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const row = rows[i] ?? {};

    const studentCode = readCell(row, ["Mã số độc giả", "Mã số chủng sinh", "studentCode"]);
    const fullName = readCell(row, ["Họ tên", "fullName"]);

    if (!studentCode || !fullName) {
      errors.push({ row: rowNum, studentCode, message: "Thiếu Mã số độc giả hoặc Họ tên" });
      continue;
    }

    const codeKey = studentCode.toLowerCase();
    if (existingCodes.has(codeKey)) {
      duplicates.push({ row: rowNum, studentCode });
      continue;
    }

    const className = readCell(row, ["Khóa / Lớp", "Khóa/Lớp", "className"]);
    const phone = readCell(row, ["Số điện thoại", "phone"]);
    const email = readCell(row, ["Email", "email"]);
    const passwordRaw = readCell(row, ["Mật khẩu", "password"]);

    if (email && existingEmails.has(email.toLowerCase())) {
      errors.push({ row: rowNum, studentCode, message: "Email đã tồn tại trong hệ thống" });
      continue;
    }

    try {
      const password = passwordRaw && passwordRaw.length >= 6 ? passwordRaw : DEFAULT_PASSWORD;
      const passwordHash = await hashPassword(password);
      await prisma.patron.create({
        data: {
          studentCode,
          fullName,
          className,
          phone,
          email: email || null,
          passwordHash,
        },
      });
      existingCodes.add(codeKey);
      if (email) existingEmails.add(email.toLowerCase());
      successCount += 1;
    } catch (err) {
      errors.push({ row: rowNum, studentCode, message: "Không thể tạo độc giả do lỗi không xác định" });
    }
  }

  return {
    totalRows: rows.length,
    successCount,
    duplicateCount: duplicates.length,
    failedCount: errors.length,
    duplicates,
    errors,
  };
}
