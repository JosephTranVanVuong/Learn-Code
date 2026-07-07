import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@thuvien/database";
import { env } from "../config/env";

const DATABASE_PRISMA_DIR = path.join(process.cwd(), "..", "..", "packages", "database", "prisma");

/** Đường dẫn thực tế của file SQLite trên đĩa, dùng cho tính năng Sao lưu/Khôi phục. */
export function resolveDbFilePath(): string {
  const raw = env.DATABASE_URL.replace(/^file:/, "");
  return path.isAbsolute(raw) ? raw : path.resolve(DATABASE_PRISMA_DIR, raw);
}

const BACKUPS_DIR_NAME = "backups";

/**
 * Chụp nhanh file SQLite hiện tại vào thư mục backups/ trước một thao tác nguy hiểm
 * (khôi phục, xóa dữ liệu hàng loạt). Ngắt kết nối Prisma trước khi copy để tránh
 * xung đột khóa file trên Windows — Prisma tự kết nối lại ở truy vấn kế tiếp.
 */
export async function createSafetyBackup(label: string): Promise<string> {
  const dbPath = resolveDbFilePath();
  const backupsDir = path.join(path.dirname(dbPath), BACKUPS_DIR_NAME);
  await fs.mkdir(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupsDir, `${label}-${timestamp}.db`);

  await prisma.$disconnect();
  await fs.copyFile(dbPath, backupPath);
  return backupPath;
}
