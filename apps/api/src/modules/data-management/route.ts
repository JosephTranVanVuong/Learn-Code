import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@thuvien/database";
import {
  ADMIN_ROLES,
  deleteWithConfirmationInputSchema,
  DELETE_ALL_CONFIRMATION_PHRASE,
  DELETE_BOOKS_CONFIRMATION_PHRASE,
  DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE,
  DELETE_LOANS_FINES_CONFIRMATION_PHRASE,
  DELETE_PATRONS_CONFIRMATION_PHRASE,
} from "@thuvien/shared";
import { verifyPassword } from "../../lib/password";
import {
  deleteAllData,
  type DeletionActor,
  deleteBooksData,
  deleteCategoriesAndAuthors,
  deleteLoansAndFines,
  deletePatronsData,
  getDeletionCounts,
  listDeletionLogs,
} from "./service";

type ConfirmationCheck = { ok: true; actor: DeletionActor } | { ok: false; status: number; message: string };

async function verifyDeleteConfirmation(request: FastifyRequest, requiredPhrase: string): Promise<ConfirmationCheck> {
  const body = deleteWithConfirmationInputSchema.parse(request.body);
  if (body.confirmationPhrase.trim() !== requiredPhrase) {
    return { ok: false, status: 400, message: `Cụm từ xác nhận không đúng — vui lòng gõ "${requiredPhrase}"` };
  }
  const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
  if (!user) {
    return { ok: false, status: 404, message: "Không tìm thấy người dùng" };
  }
  const validPassword = await verifyPassword(user.passwordHash, body.password);
  if (!validPassword) {
    return { ok: false, status: 401, message: "Mật khẩu không đúng" };
  }
  return { ok: true, actor: { id: user.id, name: user.fullName } };
}

export async function dataManagementRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireRole(...ADMIN_ROLES));

  app.get("/counts", async (_request, reply) => {
    return reply.send(await getDeletionCounts());
  });

  app.get("/logs", async (_request, reply) => {
    return reply.send(await listDeletionLogs());
  });

  app.post("/loans-fines", async (request, reply) => {
    const check = await verifyDeleteConfirmation(request, DELETE_LOANS_FINES_CONFIRMATION_PHRASE);
    if (!check.ok) return reply.code(check.status).send({ message: check.message });
    return reply.send(await deleteLoansAndFines(check.actor));
  });

  app.post("/patrons", async (request, reply) => {
    const check = await verifyDeleteConfirmation(request, DELETE_PATRONS_CONFIRMATION_PHRASE);
    if (!check.ok) return reply.code(check.status).send({ message: check.message });
    return reply.send(await deletePatronsData(check.actor));
  });

  app.post("/books", async (request, reply) => {
    const check = await verifyDeleteConfirmation(request, DELETE_BOOKS_CONFIRMATION_PHRASE);
    if (!check.ok) return reply.code(check.status).send({ message: check.message });
    return reply.send(await deleteBooksData(check.actor));
  });

  app.post("/categories-authors", async (request, reply) => {
    const check = await verifyDeleteConfirmation(request, DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE);
    if (!check.ok) return reply.code(check.status).send({ message: check.message });
    const result = await deleteCategoriesAndAuthors(check.actor);
    if (result.status === "has_books") {
      return reply.code(409).send({ message: "Vẫn còn sách thuộc các thể loại/tác giả này" });
    }
    return reply.send(result.result);
  });

  app.post("/all", async (request, reply) => {
    const check = await verifyDeleteConfirmation(request, DELETE_ALL_CONFIRMATION_PHRASE);
    if (!check.ok) return reply.code(check.status).send({ message: check.message });
    return reply.send(await deleteAllData(check.actor));
  });
}
