import type { FastifyInstance } from "fastify";
import {
  createPatronInputSchema,
  DESTRUCTIVE_ROLES,
  patronQuerySchema,
  resetPatronPasswordInputSchema,
  STAFF_ROLES,
  updatePatronInputSchema,
} from "@thuvien/shared";
import {
  createPatron,
  deactivatePatron,
  deletePatronPermanently,
  getPatron,
  getPatronByStudentCode,
  listPatrons,
  resetPatronPassword,
  updatePatron,
  updatePatronAvatar,
} from "./service";
import { listLoansForPatron } from "../loans/service";
import { deleteAvatarImageFile, isAllowedImageMime, saveAvatarImage } from "../../lib/uploads";
import { generatePatronImportTemplate, importPatronsFromExcel } from "./import";

export async function patronsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] }, async (request, reply) => {
    const query = patronQuerySchema.parse(request.query);
    return reply.send(await listPatrons(query));
  });

  app.get(
    "/me/loans",
    { preHandler: [app.authenticate, app.requireRole("CHUNG_SINH")] },
    async (request, reply) => {
      return reply.send(await listLoansForPatron(request.user.sub));
    },
  );

  app.get(
    "/by-code/:studentCode",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { studentCode } = request.params as { studentCode: string };
      const patron = await getPatronByStudentCode(studentCode);
      if (!patron) {
        return reply.code(404).send({ message: "Không tìm thấy độc giả với mã số này" });
      }
      return reply.send(patron);
    },
  );

  app.get("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isOwner = request.user.role === "CHUNG_SINH" && request.user.sub === id;
    if (!STAFF_ROLES.includes(request.user.role) && !isOwner) {
      return reply.code(403).send({ message: "Bạn không có quyền xem hồ sơ này" });
    }
    const patron = await getPatron(id);
    if (!patron) {
      return reply.code(404).send({ message: "Không tìm thấy độc giả" });
    }
    return reply.send(patron);
  });

  app.get("/:id/loans", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isOwner = request.user.role === "CHUNG_SINH" && request.user.sub === id;
    if (!STAFF_ROLES.includes(request.user.role) && !isOwner) {
      return reply.code(403).send({ message: "Bạn không có quyền xem lịch sử này" });
    }
    return reply.send(await listLoansForPatron(id));
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = createPatronInputSchema.parse(request.body);
      const result = await createPatron(body);
      if (result === "duplicate") {
        return reply.code(409).send({ message: "Mã số độc giả đã tồn tại" });
      }
      return reply.code(201).send(result);
    },
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePatronInputSchema.parse(request.body);
      const patron = await updatePatron(id, body);
      if (!patron) {
        return reply.code(404).send({ message: "Không tìm thấy độc giả" });
      }
      return reply.send(patron);
    },
  );

  app.patch(
    "/:id/mat-khau",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = resetPatronPasswordInputSchema.parse(request.body);
      const ok = await resetPatronPassword(id, body);
      if (!ok) {
        return reply.code(404).send({ message: "Không tìm thấy độc giả" });
      }
      return reply.send({ success: true });
    },
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await deactivatePatron(id);
      if (result === "not_found") {
        return reply.code(404).send({ message: "Không tìm thấy độc giả" });
      }
      if (result === "has_active_loans") {
        return reply.code(409).send({ message: "Không thể vô hiệu hóa độc giả còn sách chưa trả" });
      }
      return reply.code(204).send();
    },
  );

  app.delete(
    "/:id/permanent",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await getPatron(id);
      const result = await deletePatronPermanently(id);
      if (result === "not_found") {
        return reply.code(404).send({ message: "Không tìm thấy độc giả" });
      }
      if (result === "has_history") {
        return reply
          .code(409)
          .send({ message: "Không thể xóa vĩnh viễn độc giả đã có lịch sử mượn sách/phạt — hãy dùng chức năng vô hiệu hóa" });
      }
      await deleteAvatarImageFile(existing?.avatarUrl);
      return reply.code(204).send();
    },
  );

  app.post(
    "/:id/avatar",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await getPatron(id);
      if (!existing) {
        return reply.code(404).send({ message: "Không tìm thấy độc giả" });
      }

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ message: "Vui lòng chọn ảnh" });
      }
      if (!isAllowedImageMime(file.mimetype)) {
        return reply.code(400).send({ message: "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP" });
      }

      const buffer = await file.toBuffer();
      if (file.file.truncated) {
        return reply.code(400).send({ message: "Ảnh tối đa 5MB" });
      }

      const url = await saveAvatarImage(buffer, file.mimetype);
      await deleteAvatarImageFile(existing.avatarUrl);
      const updated = await updatePatronAvatar(id, url);
      return reply.send(updated);
    },
  );

  app.delete(
    "/:id/avatar",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await getPatron(id);
      if (!existing) {
        return reply.code(404).send({ message: "Không tìm thấy độc giả" });
      }
      await deleteAvatarImageFile(existing.avatarUrl);
      const updated = await updatePatronAvatar(id, null);
      return reply.send(updated);
    },
  );

  app.get(
    "/import/template",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const buffer = generatePatronImportTemplate();
      reply.header("Content-Disposition", 'attachment; filename="mau-nhap-doc-gia.xlsx"');
      return reply
        .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .send(buffer);
    },
  );

  app.post(
    "/import",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ message: "Vui lòng chọn file Excel" });
      }
      const hasValidExt = [".xlsx", ".xls"].some((ext) => file.filename.toLowerCase().endsWith(ext));
      if (!hasValidExt) {
        return reply.code(400).send({ message: "Chỉ chấp nhận file .xlsx hoặc .xls" });
      }
      const buffer = await file.toBuffer();
      const result = await importPatronsFromExcel(buffer);
      return reply.send(result);
    },
  );
}
