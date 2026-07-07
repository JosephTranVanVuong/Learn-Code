import { prisma } from "@thuvien/database";
import type { CreateUserInput, ResetUserPasswordInput, UpdateUserInput, User, UserQuery } from "@thuvien/shared";
import { hashPassword } from "../../lib/password";

function toUser(row: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
}): User {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role as User["role"],
    isActive: row.isActive,
    avatarUrl: row.avatarUrl,
  };
}

export async function listUsers(query: UserQuery) {
  const where = query.search
    ? {
        OR: [{ fullName: { contains: query.search } }, { email: { contains: query.search } }],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { items: rows.map(toUser), total, page: query.page, pageSize: query.pageSize };
}

export async function getUser(id: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toUser(row) : null;
}

export async function createUser(input: CreateUserInput): Promise<User | "duplicate"> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return "duplicate";

  const passwordHash = await hashPassword(input.password);
  const row = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      passwordHash,
    },
  });
  return toUser(row);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.user.update({
    where: { id },
    data: {
      fullName: input.fullName ?? existing.fullName,
      role: input.role ?? existing.role,
      isActive: input.isActive ?? existing.isActive,
    },
  });
  return toUser(row);
}

export async function updateUserAvatar(id: string, avatarUrl: string | null): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.user.update({ where: { id }, data: { avatarUrl } });
  return toUser(row);
}

export async function resetUserPassword(id: string, input: ResetUserPasswordInput): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return false;
  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return true;
}

export async function deactivateUser(id: string, requestingUserId: string): Promise<"ok" | "not_found" | "self"> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return "not_found";
  if (id === requestingUserId) return "self";
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return "ok";
}

export async function deleteUserPermanently(
  id: string,
  requestingUserId: string,
): Promise<"ok" | "not_found" | "self"> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return "not_found";
  if (id === requestingUserId) return "self";

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
  return "ok";
}
