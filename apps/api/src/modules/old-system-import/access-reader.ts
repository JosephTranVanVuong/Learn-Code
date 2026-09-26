import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface OldSystemBookRow {
  barcode: string;
  title: string;
  author: string | null;
  authorMark: string | null;
  publisher: string | null;
  publishedYear: string | null;
  isbn: string | null;
  description: string | null;
  language: string | null;
  ddc: string | null;
}

export interface OldSystemPatronRow {
  oldCode: string;
  fullName: string;
  email: string | null;
  maArchive: string | null;
}

export interface OldSystemLoanRow {
  oldPatronCode: string;
  barcode: string;
  borrowedAt: string | null;
  dueDate: string | null;
  returnedAt: string | null;
}

export interface OldSystemExport {
  books: OldSystemBookRow[];
  patrons: OldSystemPatronRow[];
  loans: OldSystemLoanRow[];
}

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "export-old-library-db.ps1");

/** Đọc file Access (.accdb/.mdb) của phần mềm thư viện cũ qua PowerShell + OLEDB (chỉ chạy được trên Windows). */
export async function readOldSystemAccessFile(dbPath: string): Promise<OldSystemExport> {
  const stat = await fs.stat(dbPath).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`Không tìm thấy file: ${dbPath}`);
  }

  const outPath = path.join(os.tmpdir(), `old-library-export-${randomUUID()}.json`);
  try {
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SCRIPT_PATH, "-DbPath", dbPath, "-OutPath", outPath],
      { maxBuffer: 1024 * 1024 * 32, timeout: 10 * 60 * 1000 },
    );
    let text = await fs.readFile(outPath, "utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return JSON.parse(text) as OldSystemExport;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Không đọc được file Access. Cần cài "Microsoft Access Database Engine" (ACE OLEDB) trên máy chạy thuvien-api và chạy trên Windows. Chi tiết: ${message}`,
    );
  } finally {
    await fs.unlink(outPath).catch(() => {});
  }
}
