import type { FastifyInstance } from "fastify";
import { ADMIN_ROLES, createPatronTypeInputSchema, STAFF_ROLES, updatePatronTypeInputSchema } from "@thuvien/shared";
import {
  createPatronType,
  deletePatronType,
  listPatronTypes,
  setDefaultPatronType,
  updatePatronType,
} from "./service";

export async function patronTypesRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] }, async (_request, reply) => {
    return reply.send(await listPatronTypes());
  });

  app.post("/", { preHandler: [app.authenticate, app.requireRole(...ADMIN_ROLES)] }, async (request, reply) => {
    const body = createPatronTypeInputSchema.parse(request.body);
    const result = await createPatronType(body);
    if (result === "duplicate") {
      return reply.code(409).send({ message: "Tên loại độc giả này đã tồn tại" });
    }
    return reply.code(201).send(result);
  });

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...ADMIN_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePatronTypeInputSchema.parse(request.body);
      const result = await updatePatronType(id, body);
      if (!result) {
        return reply.code(404).send({ message: "Không tìm thấy loại độc giả" });
      }
      return reply.send(result);
    },
  );

  app.post(
    "/:id/set-default",
    { preHandler: [app.authenticate, app.requireRole(...ADMIN_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await setDefaultPatronType(id);
      if (!result) {
        return reply.code(404).send({ message: "Không tìm thấy loại độc giả" });
      }
      return reply.send(result);
    },
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...ADMIN_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await deletePatronType(id);
      if (result === "not_found") {
        return reply.code(404).send({ message: "Không tìm thấy loại độc giả" });
      }
      if (result === "is_default") {
        return reply.code(409).send({ message: "Không thể xóa loại độc giả mặc định" });
      }
      if (result === "in_use") {
        return reply.code(409).send({ message: "Không thể xóa loại độc giả đang có độc giả" });
      }
      return reply.code(204).send();
    },
  );
}
