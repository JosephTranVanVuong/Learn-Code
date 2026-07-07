import type { FastifyInstance } from "fastify";
import { prisma } from "@thuvien/database";
import { ADMIN_ROLES, deleteAllDataInputSchema, DELETE_ALL_CONFIRMATION_PHRASE } from "@thuvien/shared";
import { verifyPassword } from "../../lib/password";
import {
  deleteAllData,
  deleteBooksData,
  deleteCategoriesAndAuthors,
  deleteLoansAndFines,
  deletePatronsData,
} from "./service";

export async function dataManagementRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireRole(...ADMIN_ROLES));

  app.post("/loans-fines", async (_request, reply) => {
    return reply.send(await deleteLoansAndFines());
  });

  app.post("/patrons", async (_request, reply) => {
    return reply.send(await deletePatronsData());
  });

  app.post("/books", async (_request, reply) => {
    return reply.send(await deleteBooksData());
  });

  app.post("/categories-authors", async (_request, reply) => {
    const result = await deleteCategoriesAndAuthors();
    if (result === "has_books") {
      return reply.code(409).send({ message: "Vẫn còn sách thuộc các thể loại/tác giả này" });
    }
    return reply.send({ success: true });
  });

  app.post("/all", async (request, reply) => {
    const body = deleteAllDataInputSchema.parse(request.body);
    if (body.confirmationPhrase.trim() !== DELETE_ALL_CONFIRMATION_PHRASE) {
      return reply.code(400).send({ message: "Cụm từ xác nhận không đúng" });
    }

    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    const validPassword = await verifyPassword(user.passwordHash, body.password);
    if (!validPassword) {
      return reply.code(401).send({ message: "Mật khẩu không đúng" });
    }

    await deleteAllData();
    return reply.send({ success: true });
  });
}
