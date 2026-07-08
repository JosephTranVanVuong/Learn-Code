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

function backupsDirPath(): string {
  const dbPath = resolveDbFilePath();
  return path.join(path.dirname(dbPath), BACKUPS_DIR_NAME);
}

/** Suy ra nhãn (label) từ tên file dạng `${label}-${isoTimestampWithDashes}.db`. */
function labelFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.db$/, "");
  const match = withoutExt.match(/^(.*)-\d{4}-\d{2}-\d{2}T/);
  return match?.[1] || withoutExt;
}

export interface BackupFileInfo {
  filename: string;
  label: string;
  createdAt: string;
  sizeBytes: number;
}

/** Toàn bộ file .db trong thư mục backups/ — gồm bản thủ công, tự động và bản an toàn trước thao tác nguy hiểm. */
export async function listBackups(): Promise<BackupFileInfo[]> {
  const dir = backupsDirPath();
  await fs.mkdir(dir, { recursive: true });
  const files = await fs.readdir(dir);
  const infos = await Promise.all(
    files
      .filter((f) => f.endsWith(".db"))
      .map(async (filename) => {
        const stat = await fs.stat(path.join(dir, filename));
        return {
          filename,
          label: labelFromFilename(filename),
          createdAt: stat.mtime.toISOString(),
          sizeBytes: stat.size,
        };
      }),
  );
  return infos.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createLabeledBackup(label: string): Promise<BackupFileInfo> {
  const backupPath = await createSafetyBackup(label);
  const stat = await fs.stat(backupPath);
  return {
    filename: path.basename(backupPath),
    label,
    createdAt: stat.mtime.toISOString(),
    sizeBytes: stat.size,
  };
}

/** Chỉ chấp nhận tên file nằm trực tiếp trong thư mục backups/ — chặn path traversal. */
function resolveBackupFilePath(filename: string): string {
  const safeName = path.basename(filename);
  if (safeName !== filename || !safeName.endsWith(".db")) {
    throw new Error("Tên file sao lưu không hợp lệ");
  }
  return path.join(backupsDirPath(), safeName);
}

export async function getBackupFileBuffer(filename: string): Promise<Buffer> {
  return fs.readFile(resolveBackupFilePath(filename));
}

export async function deleteBackupFile(filename: string): Promise<void> {
  await fs.unlink(resolveBackupFilePath(filename));
}

/** Ghi buffer đã upload/đọc từ backup đè lên file CSDL đang chạy, sau khi tự chụp nhanh bản hiện tại. */
export async function applyRestoreBuffer(uploadedBuffer: Buffer): Promise<void> {
  await createSafetyBackup("pre-restore");
  const dbPath = resolveDbFilePath();
  await fs.writeFile(dbPath, uploadedBuffer);
}

export async function restoreFromBackupFile(filename: string): Promise<void> {
  const buffer = await fs.readFile(resolveBackupFilePath(filename));
  await applyRestoreBuffer(buffer);
}

/** Xóa các bản sao lưu cũ nhất mang nhãn `label`, chỉ giữ lại `keep` bản gần nhất. */
export async function pruneBackupsByLabel(label: string, keep: number): Promise<void> {
  const all = await listBackups();
  const matching = all.filter((b) => b.label === label);
  const toDelete = matching.slice(keep);
  for (const b of toDelete) {
    await fs.unlink(path.join(backupsDirPath(), b.filename)).catch(() => {});
  }
}
