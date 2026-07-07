import type { FastifyInstance } from "fastify";
import { createAuthorInputSchema, DESTRUCTIVE_ROLES, STAFF_ROLES, updateAuthorInputSchema } from "@thuvien/shared";
import { createAuthor, deleteAuthor, listAuthors, updateAuthor } from "./service";

export async function authorsRoutes(app: FastifyInstance) {
  app.get("/", async (_request, reply) => {
    const authors = await listAuthors();
    return reply.send(authors);
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = createAuthorInputSchema.parse(request.body);
      const author = await createAuthor(body);
      return reply.code(201).send(author);
    },
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateAuthorInputSchema.parse(request.body);
      const author = await updateAuthor(id, body);
      if (!author) {
        return reply.code(404).send({ message: "Không tìm thấy tác giả" });
      }
      return reply.send(author);
    },
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await deleteAuthor(id);
      if (result === "not_found") {
        return reply.code(404).send({ message: "Không tìm thấy tác giả" });
      }
      if (result === "has_books") {
        return reply.code(409).send({ message: "Không thể xóa tác giả đang có sách" });
      }
      return reply.code(204).send();
    },
  );
}
