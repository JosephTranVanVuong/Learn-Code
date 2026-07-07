import type { FastifyInstance } from "fastify";
import { prisma } from "@thuvien/database";
import { STAFF_ROLES, type AuthUser } from "@thuvien/shared";
import { hashPassword, verifyPassword } from "../../lib/password";
import { consumeRefreshToken, issueRefreshToken } from "../../lib/refresh-token";

interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function loginStaff(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<SessionResult | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return null;

  const role = user.role as AuthUser["role"];
  const accessToken = app.jwt.sign({ sub: user.id, role });
  const refreshToken = await issueRefreshToken({ userId: user.id });
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, role, fullName: user.fullName, email: user.email },
  };
}

export async function loginPatron(
  app: FastifyInstance,
  studentCode: string,
  password: string,
): Promise<SessionResult | null> {
  const patron = await prisma.patron.findUnique({ where: { studentCode } });
  if (!patron || !patron.isActive) return null;
  const valid = await verifyPassword(patron.passwordHash, password);
  if (!valid) return null;

  const accessToken = app.jwt.sign({ sub: patron.id, role: "CHUNG_SINH" });
  const refreshToken = await issueRefreshToken({ patronId: patron.id });
  return {
    accessToken,
    refreshToken,
    user: {
      id: patron.id,
      role: "CHUNG_SINH",
      fullName: patron.fullName,
      studentCode: patron.studentCode,
    },
  };
}

/** Tự nhận diện tài khoản: thử tra bảng nhân viên (email) trước, rồi đến bảng độc giả (mã số). */
export async function loginUnified(
  app: FastifyInstance,
  identifier: string,
  password: string,
): Promise<SessionResult | null> {
  const staffResult = await loginStaff(app, identifier, password);
  if (staffResult) return staffResult;
  return loginPatron(app, identifier, password);
}

export async function refreshSession(
  app: FastifyInstance,
  rawToken: string,
): Promise<SessionResult | null> {
  const record = await consumeRefreshToken(rawToken);
  if (!record) return null;

  let user: AuthUser;
  if (record.userId) {
    const staff = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!staff || !staff.isActive) return null;
    user = {
      id: staff.id,
      role: staff.role as AuthUser["role"],
      fullName: staff.fullName,
      email: staff.email,
    };
  } else if (record.patronId) {
    const patron = await prisma.patron.findUnique({ where: { id: record.patronId } });
    if (!patron || !patron.isActive) return null;
    user = {
      id: patron.id,
      role: "CHUNG_SINH",
      fullName: patron.fullName,
      studentCode: patron.studentCode,
    };
  } else {
    return null;
  }

  const accessToken = app.jwt.sign({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken({
    userId: record.userId ?? undefined,
    patronId: record.patronId ?? undefined,
  });
  return { accessToken, refreshToken, user };
}

/** Tự đổi mật khẩu của chính tài khoản đang đăng nhập — yêu cầu xác minh mật khẩu hiện tại. */
export async function changeOwnPassword(
  role: AuthUser["role"],
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "not_found" | "invalid_current_password"> {
  if (STAFF_ROLES.includes(role)) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return "not_found";
    const valid = await verifyPassword(user.passwordHash, currentPassword);
    if (!valid) return "invalid_current_password";
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    return "ok";
  }

  const patron = await prisma.patron.findUnique({ where: { id } });
  if (!patron) return "not_found";
  const valid = await verifyPassword(patron.passwordHash, currentPassword);
  if (!valid) return "invalid_current_password";
  const passwordHash = await hashPassword(newPassword);
  await prisma.patron.update({ where: { id }, data: { passwordHash } });
  return "ok";
}

export async function getMe(role: AuthUser["role"], id: string): Promise<AuthUser | null> {
  if (STAFF_ROLES.includes(role)) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { id: user.id, role: user.role as AuthUser["role"], fullName: user.fullName, email: user.email };
  }
  const patron = await prisma.patron.findUnique({ where: { id } });
  if (!patron) return null;
  return { id: patron.id, role: "CHUNG_SINH", fullName: patron.fullName, studentCode: patron.studentCode };
}
