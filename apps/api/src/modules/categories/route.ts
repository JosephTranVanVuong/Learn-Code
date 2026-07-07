import type { FastifyInstance } from "fastify";
import { createCategoryInputSchema, DESTRUCTIVE_ROLES, STAFF_ROLES, updateCategoryInputSchema } from "@thuvien/shared";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./service";

export async function categoriesRoutes(app: FastifyInstance) {
  app.get("/", async (_request, reply) => {
    const categories = await listCategories();
    return reply.send(categories);
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = createCategoryInputSchema.parse(request.body);
      const category = await createCategory(body);
      return reply.code(201).send(category);
    },
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateCategoryInputSchema.parse(request.body);
      const category = await updateCategory(id, body);
      if (!category) {
        return reply.code(404).send({ message: "Không tìm thấy thể loại" });
      }
      return reply.send(category);
    },
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await deleteCategory(id);
      if (result === "not_found") {
        return reply.code(404).send({ message: "Không tìm thấy thể loại" });
      }
      if (result === "has_books") {
        return reply.code(409).send({ message: "Không thể xóa thể loại đang có sách" });
      }
      return reply.code(204).send();
    },
  );
}
