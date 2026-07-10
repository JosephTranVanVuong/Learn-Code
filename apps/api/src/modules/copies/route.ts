import type { FastifyInstance } from "fastify";
import { DESTRUCTIVE_ROLES, exportBarcodesInputSchema, STAFF_ROLES, updateCopyInputSchema } from "@thuvien/shared";
import { deleteCopy, exportBarcodesForCopies, getCopyByBarcode, updateCopy } from "./service";

export async function copiesRoutes(app: FastifyInstance) {
  app.get(
    "/by-barcode/:barcode",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { barcode } = request.params as { barcode: string };
      const copy = await getCopyByBarcode(barcode);
      if (!copy) {
        return reply.code(404).send({ message: "Không tìm thấy bản sao với mã vạch này" });
      }
      return reply.send(copy);
    },
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateCopyInputSchema.parse(request.body);
      const copy = await updateCopy(id, body);
      if (!copy) {
        return reply.code(404).send({ message: "Không tìm thấy bản sao" });
      }
      return reply.send(copy);
    },
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await deleteCopy(id);
      if (result === "not_found") {
        return reply.code(404).send({ message: "Không tìm thấy bản sao" });
      }
      if (result === "borrowed") {
        return reply.code(409).send({ message: "Không thể xóa bản sao đang được mượn" });
      }
      return reply.code(204).send();
    },
  );

  app.post(
    "/export-barcodes",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = exportBarcodesInputSchema.parse(request.body);
      const buffer = await exportBarcodesForCopies(body.copyIds);
      if (!buffer) {
        return reply.code(404).send({ message: "Không tìm thấy bản sao nào phù hợp" });
      }
      reply.header("Content-Disposition", 'attachment; filename="nhan-ma-vach.docx"');
      return reply
        .type("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        .send(buffer);
    },
  );
}
