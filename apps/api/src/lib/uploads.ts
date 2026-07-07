import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedImageMime(mime: string): boolean {
  return mime in ALLOWED_MIME_TO_EXT;
}

async function saveImage(dir: string, urlPrefix: string, buffer: Buffer, mimetype: string): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const ext = ALLOWED_MIME_TO_EXT[mimetype] ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `${urlPrefix}${filename}`;
}

async function deleteImageFile(dir: string, urlPrefix: string, imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(urlPrefix)) return;
  const filename = imageUrl.slice(urlPrefix.length);
  await fs.unlink(path.join(dir, filename)).catch(() => {});
}

const COVERS_DIR = path.join(UPLOADS_ROOT, "covers");
const COVERS_URL_PREFIX = "/uploads/covers/";

export function saveCoverImage(buffer: Buffer, mimetype: string): Promise<string> {
  return saveImage(COVERS_DIR, COVERS_URL_PREFIX, buffer, mimetype);
}

export function deleteCoverImageFile(coverImageUrl: string | null | undefined): Promise<void> {
  return deleteImageFile(COVERS_DIR, COVERS_URL_PREFIX, coverImageUrl);
}

const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");
const AVATARS_URL_PREFIX = "/uploads/avatars/";

export function saveAvatarImage(buffer: Buffer, mimetype: string): Promise<string> {
  return saveImage(AVATARS_DIR, AVATARS_URL_PREFIX, buffer, mimetype);
}

export function deleteAvatarImageFile(avatarUrl: string | null | undefined): Promise<void> {
  return deleteImageFile(AVATARS_DIR, AVATARS_URL_PREFIX, avatarUrl);
}

const LOGOS_DIR = path.join(UPLOADS_ROOT, "logos");
const LOGOS_URL_PREFIX = "/uploads/logos/";

export function saveLogoImage(buffer: Buffer, mimetype: string): Promise<string> {
  return saveImage(LOGOS_DIR, LOGOS_URL_PREFIX, buffer, mimetype);
}

export function deleteLogoImageFile(logoUrl: string | null | undefined): Promise<void> {
  return deleteImageFile(LOGOS_DIR, LOGOS_URL_PREFIX, logoUrl);
}
