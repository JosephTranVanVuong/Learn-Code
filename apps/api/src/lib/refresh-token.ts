import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@thuvien/database";
import { REFRESH_TOKEN_TTL_DAYS } from "@thuvien/shared";

export interface TokenOwner {
  userId?: string;
  patronId?: string;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueRefreshToken(owner: TokenOwner): Promise<string> {
  const raw = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(raw),
      userId: owner.userId,
      patronId: owner.patronId,
      expiresAt,
    },
  });
  return raw;
}

export async function consumeRefreshToken(raw: string) {
  const tokenHash = hashToken(raw);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    return null;
  }
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
  return record;
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const tokenHash = hashToken(raw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
