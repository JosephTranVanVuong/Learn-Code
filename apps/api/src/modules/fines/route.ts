import type { FastifyInstance } from "fastify";
import { fineQuerySchema, STAFF_ROLES } from "@thuvien/shared";
import { getFine, listFines, listFinesForPatron, payFine, waiveFine } from "./service";

const FINE_ACTION_ERRORS = {
  not_found: { status: 404, message: "Không tìm thấy khoản phạt" },
  not_unpaid: { status: 409, message: "Khoản phạt này đã được xử lý trước đó" },
} satisfies Record<string, { status: number; message: string }>;

export async function finesRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] }, async (request, reply) => {
    const query = fineQuerySchema.parse(request.query);
    return reply.send(await listFines(query));
  });

  app.get(
    "/me",
    { preHandler: [app.authenticate, app.requireRole("CHUNG_SINH")] },
    async (request, reply) => {
      return reply.send(await listFinesForPatron(request.user.sub));
    },
  );

  app.get("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const fine = await getFine(id);
    if (!fine) {
      return reply.code(404).send({ message: "Không tìm thấy khoản phạt" });
    }
    const isOwner = request.user.role === "CHUNG_SINH" && request.user.sub === fine.patronId;
    if (!STAFF_ROLES.includes(request.user.role) && !isOwner) {
      return reply.code(403).send({ message: "Bạn không có quyền xem khoản phạt này" });
    }
    return reply.send(fine);
  });

  app.post(
    "/:id/pay",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await payFine(id);
      if (!result.ok) {
        const err = FINE_ACTION_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.send(result.fine);
    },
  );

  app.patch(
    "/:id/waive",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await waiveFine(id);
      if (!result.ok) {
        const err = FINE_ACTION_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.send(result.fine);
    },
  );
}
